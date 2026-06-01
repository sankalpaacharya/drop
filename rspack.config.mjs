// @ts-check

/** @type {import('@rspack/core').Configuration} */

import { fileURLToPath } from "node:url";
import path, { resolve } from "node:path";
import fs, { readdirSync } from "node:fs";
import { ClientManifestPlugin } from "./packages/drop/src/rspack/plugins/client-manifest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {Record<string, string>} */
const clientComponents = {};

function findClientComponents(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      const content = fs.readFileSync(filePath, "utf-8").trimStart();
      let firstLine = content.split("\n")[0];
      firstLine = firstLine.replace(/;$/, "").trim();
      if (firstLine === '"use client"' || firstLine === "'use client'") {
        const name = path
          .relative(__dirname, filePath)
          .split(path.sep)
          .join("/");
        clientComponents[name] = filePath;
      }
    } else {
      findClientComponents(filePath);
    }
  }
}

findClientComponents(path.resolve(__dirname, "examples/basic/src"));

// Generate a "barrel" that IMPORTS every client component, so each one becomes a
// requireable module in __webpack_modules__ (an entry would only EXECUTE them).
const clientBarrelPath = path.resolve(
  __dirname,
  "examples/basic/src/__client_barrel__.js",
);
const clientBarrel = Object.entries(clientComponents)
  .map(
    ([name, abs], i) =>
      `import * as m${i} from ${JSON.stringify(abs)};\n(globalThis.__CLIENT_REFS__ ??= {})[${JSON.stringify(name)}] = m${i};`,
  )
  .join("\n");
fs.writeFileSync(clientBarrelPath, clientBarrel);

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

const clientConfig = {
  name: "client",
  target: "web",
  mode: "development",
  plugins: [new ClientManifestPlugin(clientComponents)],
  entry: {
    main: ["./src/entry.client.tsx", clientBarrelPath],
  },
  output: {
    path: path.resolve(__dirname, "dist/client"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [swcRule],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
};

const serverConfig = {
  name: "server",
  target: "node",
  mode: "development",
  entry: {
    rsc: { import: "./src/entry.rsc.tsx", layer: "react-server" },
    ssr: { import: "./src/entry.ssr.tsx", layer: "ssr" },
  },
  output: {
    path: path.resolve(__dirname, "dist/server"),
    filename: "[name].cjs",
    library: { type: "commonjs2" },
    clean: true,
  },
  module: {
    rules: [
      swcRule,
      {
        issuerLayer: "react-server",
        resolve: {
          conditionNames: ["react-server", "..."],
        },
      },
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: path.resolve(
              __dirname,
              "packages/drop/src/rspack/loaders/use-client.mjs",
            ),
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
};

export default [clientConfig, serverConfig];
