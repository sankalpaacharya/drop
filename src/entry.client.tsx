import React from "react";
import { createRoot } from "react-dom/client";
import { Root } from "./app/Root";

const container = document.getElementById("root");
if (!container) throw new Error("#root not found");

createRoot(container).render(<Root />);
