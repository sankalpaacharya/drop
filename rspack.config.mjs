import { experiments } from "@rspack/core";

const { createPlugins, Layers } = experiments.rsc;
const { ServerPlugin, ClientPlugin } = createPlugins();

export default [
  {
    // Client Compiler
    target: "web",
    plugins: [new ClientPlugin()],
    entry: {
      main: { import: "./src/entry.client.tsx" },
    },
    // ...client-specific config
  },
  {
    // Server Compiler
    target: "node",
    plugins: [new ServerPlugin()],

    main: { import: "./src/entry.rsc.tsx" },
    // ...server-specific config
  },
];
