// import React from "react";
// import { renderToString } from "react-dom/server";
// import { Root } from "./app/Root";

// const html = renderToString(<Root />);
// console.log(typeof React.useState);
// console.log("export count:", Object.keys(React).length);

import React from "react";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { renderToPipeableStream } from "react-server-dom-webpack/server";
import { renderToString } from "react-dom/server";
// `@app/page` is an rspack alias the framework's config builder sets to point at
// the user's src/app/page.tsx — keeps this runtime app-agnostic.
import Page from "@app/page";

// Resolve paths relative to this bundled file (dist/server/rsc.cjs),
// not the cwd — so the server runs correctly no matter where it's invoked from.
const distDir = path.resolve(__dirname, "..");
const clientDir = path.join(distDir, "client");

const clientManifest = JSON.parse(
  fs.readFileSync(path.join(distDir, "client-manifest.json"), "utf-8"),
);

const server = http.createServer((req, res) => {
  if (req.url === "/rsc") {
    res.setHeader("Content-Type", "text/x-component");
    const { pipe } = renderToPipeableStream(<Page />, clientManifest);
    pipe(res);
    return;
  }

  if (req.url === "/main.js") {
    res.setHeader("Content-Type", "text/javascript");
    fs.createReadStream(path.join(clientDir, "main.js")).pipe(res);
    return;
  }
  res.setHeader("Content-Type", "text/html");
  res.end(
    `<!doctype html><html><body><div id="root"></div><script src="/main.js"></script></body></html>`,
  );
});

server.listen(3000, () => console.log("→ http://localhost:3000"));
