// @ts-check
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import {
  ClientManifestPlugin,
  ServerConsumerManifestPlugin,
} from "./plugins/client-manifest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// drop's OWN runtime + transform files (located relative to THIS config file)
const CLIENT_RUNTIME = path.resolve(__dirname, "../client/runtime.tsx");
const SSR_ENTRY = path.resolve(__dirname, "../server/ssr.tsx");
const RSC_RENDERER = path.resolve(__dirname, "../server/rsc-renderer.tsx");
const USE_CLIENT_LOADER = path.resolve(__dirname, "./loaders/use-client.mjs");

/**
 * Walk `dir` recursively, collect any file whose first non-whitespace line is
 * `"use client"` or `'use client'`. Returns a map of relative-path -> absolute-path.
 * @param {string} dir
 * @param {string} rootDir
 * @param {Record<string, string>} acc
 */
function findClientComponents(dir, rootDir, acc = {}) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      findClientComponents(full, rootDir, acc);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry)) continue;
    const src = fs.readFileSync(full, "utf-8").trimStart();
    const firstLine = src.split("\n")[0].replace(/;$/, "").trim();
    if (firstLine === '"use client"' || firstLine === "'use client'") {
      const name = path.relative(rootDir, full).split(path.sep).join("/");
      acc[name] = full; // key matches what the loader stamps as $$id
    }
  }
  return acc;
}

/**
 * Build the dual-compiler rspack config for a drop app.
 * @param {{ appDir: string; outDir?: string }} options
 */
export function createConfig({ appDir, outDir }) {
  const projectRoot = path.resolve(appDir, "..");
  const output = outDir
    ? path.resolve(outDir)
    : path.resolve(projectRoot, "dist");

  // 1. Discover all "use client" files under the user's appDir.
  const clientComponents = findClientComponents(appDir, projectRoot);

  // 2. Generate a barrel that statically imports each one (so they're requireable in the client bundle).
  const clientBarrelPath = path.resolve(appDir, "__client_barrel__.js");
  const barrel = Object.entries(clientComponents)
    .map(
      ([name, abs], i) =>
        `import * as m${i} from ${JSON.stringify(abs)};\n(globalThis.__CLIENT_REFS__ ??= {})[${JSON.stringify(name)}] = m${i};`,
    )
    .join("\n");
  fs.writeFileSync(clientBarrelPath, barrel);

  const swcRule = {
    test: /\.(?:js|mjs|jsx|ts|tsx)$/,
    use: {
      loader: "builtin:swc-loader",
      options: {
        detectSyntax: "auto",
        jsc: {
          transform: {
            react: {
              pragma: "React.createElement",
              pragmaFrag: "React.Fragment",
              throwIfNamespace: true,
              development: false,
            },
          },
        },
      },
    },
    type: "javascript/auto",
  };

  /** @type {import('@rspack/core').Configuration} */
  const clientConfig = {
    name: "client",
    target: "web",
    mode: "development",
    plugins: [new ClientManifestPlugin(clientComponents)],
    entry: {
      main: [CLIENT_RUNTIME, clientBarrelPath],
    },
    output: {
      path: path.resolve(output, "client"),
      filename: "[name].js",
      clean: true,
    },
    module: { rules: [swcRule] },
    resolve: { extensions: [".tsx", ".ts", ".jsx", ".js"] },
  };

  /** @type {import('@rspack/core').Configuration} */
  const serverConfig = {
    name: "server",
    target: "node",
    mode: "development",
    entry: {
      ssr: { import: [clientBarrelPath, SSR_ENTRY], layer: "ssr" },
    },
    dependencies: ["client"],
    output: {
      path: path.resolve(output, "server"),
      filename: "[name].cjs",
      library: { type: "commonjs2" },
      clean: true,
    },
    plugins: [new ServerConsumerManifestPlugin(clientComponents)],
    module: {
      rules: [
        swcRule,
        {
          test: RSC_RENDERER,
          layer: "react-server",
        },
        {
          issuerLayer: "react-server",
          layer: "react-server",
          resolve: { conditionNames: ["react-server", "..."] },
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          issuerLayer: "react-server",
          use: [{ loader: USE_CLIENT_LOADER }],
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"],
      // virtual import name → the user's actual root page component.
      alias: {
        "@app/page": path.resolve(appDir, "app/page.tsx"),
      },
    },
  };

  return [clientConfig, serverConfig];
}
