// @ts-check

/** @type {import('@rspack/core').Configuration} */

import { fileURLToPath } from "node:url";
import path, { resolve } from "node:path";

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
    main: "./src/entry.server.tsx",
  },
  output: {
    path: path.resolve(__dirname, "dist/server"),
    filename: "[name].cjs",
    library: { type: "commonjs2" },
    clean: true,
  },
  module: {
    rules: [swcRule],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
};

export default [clientConfig, serverConfig];
