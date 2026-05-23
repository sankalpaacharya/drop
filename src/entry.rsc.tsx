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
import { Root } from "./app/Root";

const clientDir = path.resolve(process.cwd(), "dist/client");

const server = http.createServer((req, res) => {
  if (req.url === "/rsc") {
    res.setHeader("Content-Type", "text/x-component");
    const { pipe } = renderToPipeableStream(<Root />, {});
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
