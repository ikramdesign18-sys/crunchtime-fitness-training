import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

if (process.env.VERCEL !== "1") {
  loadEnv({ path: fileURLToPath(new URL("./.env", import.meta.url)) });
}

const { default: app } = await import("./src/app");

export default app;
