import { createConfig } from "drop/rspack-config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default createConfig({
  appDir: path.resolve(__dirname, "src"),
});
