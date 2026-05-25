import fs from "node:fs";
import path from "node:path";

export class ClientManifestPlugin {
  constructor(clientComponents) {
    this.clientComponents = clientComponents;
  }

  apply(compiler) {
    const clientPaths = new Set(Object.values(this.clientComponents));

    compiler.hooks.afterEmit.tap("ClientManifestPlugin", (compilation) => {
      const manifest = {};

      for (const module of compilation.modules) {
        if (!clientPaths.has(module.resource)) continue;

        const id = compilation.chunkGraph.getModuleId(module);

        const chunks = [];
        for (const chunk of compilation.chunkGraph.getModuleChunksIterable(
          module,
        )) {
          chunks.push(chunk.id, [...chunk.files][0]);
        }

        const key = path
          .relative(compiler.context, module.resource)
          .split(path.sep)
          .join("/");

        manifest[key] = { id, chunks };
      }

      fs.writeFileSync(
        path.resolve(compiler.context, "dist/client-manifest.json"),
        JSON.stringify(manifest, null, 2),
      );
    });
  }
}
