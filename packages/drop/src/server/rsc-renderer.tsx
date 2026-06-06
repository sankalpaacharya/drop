import * as React from "react";
import { renderToPipeableStream } from "react-server-dom-webpack/server.node";
import Page from "@app/page";

export function renderFlight(clientManifest: unknown) {
  return renderToPipeableStream(<Page />, clientManifest);
}
