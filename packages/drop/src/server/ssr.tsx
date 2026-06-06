import * as React from "react";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { createFromNodeStream } from "react-server-dom-webpack/client.node";
import { renderFlight } from "./rsc-renderer";

type FlightResponse = ReturnType<typeof createFromNodeStream>;

const distDir = path.resolve(__dirname, "..");
const clientDir = path.join(distDir, "client");
const port = Number(process.env.PORT ?? 3000);

const clientManifest = JSON.parse(
  fs.readFileSync(path.join(distDir, "client-manifest.json"), "utf-8"),
);

const serverConsumerManifest = JSON.parse(
  fs.readFileSync(path.join(distDir, "server-consumer-manifest.json"), "utf-8"),
);

function App({ response }: { response: FlightResponse }) {
  return React.use(response);
}

function Document({ response }: { response: FlightResponse }) {
  return (
    <html>
      <head>
        <title>Drop</title>
      </head>
      <body>
        <div id="root">
          <React.Suspense fallback={null}>
            <App response={response} />
          </React.Suspense>
        </div>
      </body>
    </html>
  );
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (url.pathname === "/rsc") {
    res.setHeader("Content-Type", "text/x-component");
    const { pipe } = renderFlight(clientManifest);
    pipe(res);
    return;
  }

  if (url.pathname === "/main.js") {
    res.setHeader("Content-Type", "text/javascript");
    fs.createReadStream(path.join(clientDir, "main.js")).pipe(res);
    return;
  }

  if (url.pathname === "/") {
    const flightStream = new PassThrough();
    const { pipe: pipeFlight } = renderFlight(clientManifest);
    const response = createFromNodeStream(flightStream, serverConsumerManifest);

    pipeFlight(flightStream);

    const { pipe } = renderToPipeableStream(<Document response={response} />, {
      bootstrapScripts: ["/main.js"],
      onAllReady() {
        res.setHeader("Content-Type", "text/html");
        pipe(res);
      },
      onError(error) {
        console.error(error);
        if (!res.headersSent) res.statusCode = 500;
      },
    });
    return;
  }

  res.statusCode = 404;
  res.end("Not found");
});

server.listen(port, () => console.log(`→ http://localhost:${port}`));
