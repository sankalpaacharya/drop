// @ts-check

/** @type {import('@rspack/core').Configuration} */

import { fileURLToPath } from "node:url";
import path, { resolve } from "node:path";
import { ClientManifestPlugin } from "./plugins/client-mainfest-plugin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  plugins: [new ClientManifestPlugin()],
  entry: {
    main: "./src/entry.client.tsx",
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
          { loader: path.resolve(__dirname, "loaders/use-client-loaders.mjs") },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
};

export default [clientConfig, serverConfig];
