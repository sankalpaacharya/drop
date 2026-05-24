/**
 * A custom loader. Rspack calls this for every matching module
 * `source` is the files contents as a string
 * `this` is the loader context
 * this is going to be used for genereating a minifest for the client component
 *
 * **/

import { parseSync } from "@swc/core";
import path from "node:path";

function collectExports(source) {
  const names = [];
  const ast = parseSync(source, { syntax: "typescript", tsx: true });
  for (const item of ast.body) {
    switch (item.type) {
      case "ExportDeclaration": {
        names.push(item.declaration.identifier.value);
        break;
      }
    }
  }
  return names;
}

export default function useClientLoader(source) {
  const trimmed = source.trimStart();
  const isClient =
    trimmed.startsWith("'use client'") || trimmed.startsWith('"use client"');
  if (!isClient) return source;
  const id = path.relative(this.rootContext, this.resourcePath);
  const exports = collectExports(source);
  let out = `import { registerClientReference } from "react-server-dom-webpack/server";\n`;

  for (const name of exports) {
    out += `export const ${name} = registerClientReference(() => { throw new Error("client only"); }, "${id}", "${name}");\n`;
  }
  return out;
}
