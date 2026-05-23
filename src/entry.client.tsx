import React, { Suspense, use } from "react";
import { createRoot } from "react-dom/client";
import { Root } from "./app/Root";
import { createFromFetch } from "react-server-dom-webpack/client";

// const container = document.getElementById("root");
// if (!container) throw new Error("#root not found");

// createRoot(container).render(<Root />);
const flight = createFromFetch(fetch("/rsc"));

function Shell() {
  return use(flight);
}

createRoot(document.getElementById("root")!).render(
  <Suspense fallback={<p>loading...</p>}>
    <Shell />
  </Suspense>,
);
