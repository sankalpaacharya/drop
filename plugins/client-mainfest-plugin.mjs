export class ClientManifestPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap("ClientManifestPlugin", (compilation) => {
      for (const module of compilation.modules) {
        console.log(module.resource);
      }
    });
  }
}
