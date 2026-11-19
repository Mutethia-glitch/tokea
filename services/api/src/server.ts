import { createServer } from "node:http";
import { pool } from "./db.js";
import { route } from "./routes.js";
import { processPushBatch } from "./worker.js";

const port = Number(process.env.PORT || "4400");
const server = createServer((req, res) => { void route(req, res); });
server.requestTimeout = 10_000;
server.headersTimeout = 15_000;
const host = process.env.HOST || "0.0.0.0";
server.listen(port, host, () => console.log(`Tokea API listening on ${host}:${port}`));

// Keep push dispatch separate from request transactions; a production deployment
// should run this worker independently with job monitoring and push receipts.
let worker: ReturnType<typeof setInterval> | null = null;
if (process.env.ENABLE_PUSH_WORKER === "true") {
  if (!process.env.EXPO_ACCESS_TOKEN) throw Error("EXPO_ACCESS_TOKEN required when push worker is enabled.");
  worker = setInterval(() => { void processPushBatch().catch((error) => console.error("Push worker error", error)); }, 5_000);
}
async function stop() {
  if (worker) clearInterval(worker);
  server.close();
  await pool.end();
}
process.once("SIGINT", () => { void stop(); });
process.once("SIGTERM", () => { void stop(); });
