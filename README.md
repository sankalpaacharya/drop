<div align="center">
  <img src="./public/logo.png" alt="drop logo" width="140" />

  <h1>drop</h1>

  <p><strong>A minimal React Server Components framework, built from scratch — for learning.</strong></p>

  <p>
    <img alt="React 19" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
    <img alt="Rspack" src="https://img.shields.io/badge/bundler-Rspack-f93920" />
    <img alt="status" src="https://img.shields.io/badge/status-WIP-yellow" />
  </p>
</div>

---

## What is this?

**drop** is a tiny React framework I'm building from the ground up to understand how
React Server Components (RSC) actually work — the bundler wiring, the module graph,
the client/server boundary, and the flight protocol — without the magic of Next.js
or Waku hiding the moving parts.

It uses [**Rspack**](https://rspack.dev) as the bundler.

## How RSC works here

A request flows through three stages:

1. **Server components render to a flight stream.** The RSC server runtime renders
   `<Page />` with `renderToPipeableStream` and serves it at `/rsc` as a
   `text/x-component` stream. Async server components (e.g. an `await db.user.findFirst()`)
   run entirely on the server.
2. **Client components become references on the server.** A custom Rspack loader scans
   for `"use client"` files and replaces their exports with `registerClientReference`
   stubs, so the server never bundles client code — it only emits pointers into a
   **client manifest**.
3. **The browser fetches and reconstructs the tree.** The client runtime calls
   `createFromFetch("/rsc")`, hydrates the server-rendered tree, and resolves each
   client reference to real, interactive code (e.g. the `<Counter />` button).

## Architecture

```
packages/drop/                  the framework itself
├── src/rspack/
│   ├── config.mjs              dual-compiler (client + server) Rspack config
│   ├── loaders/
│   │   └── use-client.mjs      rewrites "use client" exports → client references
│   └── plugins/
│       └── client-manifest.mjs emits dist/client-manifest.json (id + chunks)
├── src/server/
│   ├── rsc-renderer.tsx        react-server layer: renders the Flight stream
│   └── ssr.tsx                 app server: serves /, /rsc, and client assets
└── src/client/
    └── runtime.tsx             browser entry: createFromFetch + hydrate

examples/basic/                 a demo app that consumes drop
├── rspack.config.mjs           calls drop's createConfig({ appDir })
└── src/app/
    ├── page.tsx                async server component
    └── Counter.tsx             "use client" interactive component
```

### Key pieces

- **`createConfig`** ([config.mjs](packages/drop/src/rspack/config.mjs)) — builds two
  Rspack compilers: a `web`-targeted **client** bundle and a `node`-targeted **server**
  bundle. The server bundle uses Rspack **layers** (`react-server` / `ssr`) with the
  `react-server` export condition so React resolves to its server build.
- **`use-client` loader** ([use-client.mjs](packages/drop/src/rspack/loaders/use-client.mjs)) —
  parses each module with SWC, and if it starts with `"use client"`, replaces every
  export with a `registerClientReference(...)` stub keyed by file path + export name.
- **`ClientManifestPlugin`** ([client-manifest.mjs](packages/drop/src/rspack/plugins/client-manifest.mjs)) —
  after emit, walks the module graph for the discovered client components and writes a
  manifest mapping each one to its module `id` and chunk files.
- **Client barrel** — `createConfig` generates a `__client_barrel__.js` that statically
  imports every client component into `globalThis.__CLIENT_REFS__`, so they're
  requireable when the flight stream asks for them.

## Getting started

```bash
# install (pnpm workspace)
pnpm install

# build the example app (client + server bundles)
pnpm run build

# build a single compiler if you only changed one side
pnpm run build:client
pnpm run build:server
```

Then run the SSR server and open it in the browser:

```bash
node dist/server/ssr.cjs
# → http://localhost:3000
```

You'll see the server-rendered dashboard with an interactive `<Counter />` —
the button's state lives entirely on the client, while the page around it
was rendered on the server.

> **Note:** This is an active learning project. The `drop dev` CLI and the SSR
> layer are still works in progress; the build → serve flow above is the path
> that works today.

## Tech

- **React 19** + `react-server-dom-webpack`
- **Rspack** (`@rspack/core`, `@rspack/cli`) for bundling
- **SWC** for parsing/transform inside the custom loader
- **pnpm** workspaces — `packages/drop` (framework) + `examples/basic` (demo)

## Status

🐧 Work in progress, built for learning. Expect rough edges, half-finished
layers, and code that exists to teach rather than to ship.
