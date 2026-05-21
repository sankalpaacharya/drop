import React from "react";
import { renderToString } from "react-dom/server";
import { Root } from "./app/Root";

const html = renderToString(<Root />);
console.log(html);
