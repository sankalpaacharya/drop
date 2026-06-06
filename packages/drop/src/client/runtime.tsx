import React, { Suspense, use } from "react";
import { hydrateRoot } from "react-dom/client";
import { createFromFetch } from "react-server-dom-webpack/client";

// const container = document.getElementById("root");
// if (!container) throw new Error("#root not found");

// createRoot(container).render(<Root />);
const flight = createFromFetch(fetch("/rsc"));

function Shell() {
  return use(flight);
}

hydrateRoot(
  document.getElementById("root")!,
  <Suspense fallback={<p>loading...</p>}>
    <Shell />
  </Suspense>,
);
