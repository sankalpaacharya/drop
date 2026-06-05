import * as React from "react";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { renderToPipeableStream } from "react-server-dom-webpack/server";
import { renderToPipeableStream as ssrRenderToPipeableStream } from "react-dom/server";
import { createFromNodeStream } from "react-server-dom-webpack/client";
import { Suspense } from "react";


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
  if (req.url === "/") {
    const { pipe } = ssrRenderToPipeableStream(<Page />, {
      onShellReady() {
        res.setHeader("Content-Type", "text/html");
        pipe(res);
      }
    });
    return;
  }
});

server.listen(3000, () => console.log("→ http://localhost:3000"));
