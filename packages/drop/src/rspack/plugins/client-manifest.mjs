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

export class ServerConsumerManifestPlugin {
  constructor(clientComponents) {
    this.clientComponents = clientComponents;
  }

  apply(compiler) {
    const clientPaths = new Set(Object.values(this.clientComponents));

    compiler.hooks.afterEmit.tap("ServerConsumerManifestPlugin", (compilation) => {
      const clientManifestPath = path.resolve(
        compiler.context,
        "dist/client-manifest.json",
      );
      const clientManifest = JSON.parse(
        fs.readFileSync(clientManifestPath, "utf-8"),
      );
      const moduleMap = {};

      for (const module of compilation.modules) {
        if (!clientPaths.has(module.resource)) continue;
        if (module.layer === "react-server") continue;

        const key = path
          .relative(compiler.context, module.resource)
          .split(path.sep)
          .join("/");
        const clientModule = clientManifest[key];
        if (!clientModule) continue;

        const id = compilation.chunkGraph.getModuleId(module);
        if (id == null) continue;

        moduleMap[clientModule.id] = {
          "*": {
            id,
            chunks: [],
            name: "*",
          },
        };
      }

      fs.writeFileSync(
        path.resolve(compiler.context, "dist/server-consumer-manifest.json"),
        JSON.stringify(
          {
            moduleMap,
            serverModuleMap: {},
            moduleLoading: null,
          },
          null,
          2,
        ),
      );
    });
  }
}
