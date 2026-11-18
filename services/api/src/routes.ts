import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { authenticate, ApiError } from "./auth.js";
import { decideJoinRequest } from "./decisions.js";
import { getInbox, markInboxRead } from "./inbox.js";
import { registerDevice, unregisterDevice } from "./devices.js";

const decisionSchema = z.object({ decision: z.enum(["accepted", "declined"]) }).strict();
const tokenSchema = z.object({
  token: z.string().min(1).max(255), platform: z.enum(["ios", "android"]),
}).strict();

function respond(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(JSON.stringify(body));
}

async function parseBody(req: IncomingMessage) {
  if (req.headers["content-type"]?.split(";")[0] !== "application/json") throw new ApiError(415, "JSON request body required.");
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > 16384) throw new ApiError(413, "Request is too large.");
    chunks.push(buffer);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ApiError(400, "Invalid JSON."); }
}
const uuid = "[0-9a-fA-F-]{36}";

export async function route(req: IncomingMessage, res: ServerResponse) {
  try {
    const method = req.method ?? "GET";
    const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
    if (method === "GET" && pathname === "/healthz") return respond(res, 200, { ok: true, service: "tokea-api" });
    const userId = await authenticate(req.headers);

    if (method === "GET" && pathname === "/v1/notifications")
      return respond(res, 200, { notifications: await getInbox(userId) });

    const decisionPath = new RegExp(`^/v1/sessions/(${uuid})/requests/(${uuid})/decision$`).exec(pathname);
    if (method === "POST" && decisionPath) {
      const data = decisionSchema.parse(await parseBody(req));
      return respond(res, 200, await decideJoinRequest(userId, decisionPath[1]!, decisionPath[2]!, data.decision));
    }
    const markPath = new RegExp(`^/v1/notifications/(${uuid})/read$`).exec(pathname);
    if (method === "PATCH" && markPath) return respond(res, 200, await markInboxRead(userId, markPath[1]!));
    if (method === "POST" && pathname === "/v1/devices") {
      const data = tokenSchema.parse(await parseBody(req));
      return respond(res, 201, await registerDevice(userId, data.token, data.platform));
    }
    const devicePath = new RegExp(`^/v1/devices/(${uuid})$`).exec(pathname);
    if (method === "DELETE" && devicePath) return respond(res, 200, await unregisterDevice(userId, devicePath[1]!));
    throw new ApiError(404, "Route not found.");
  } catch (error) {
    if (error instanceof ApiError) return respond(res, error.status, { error: error.message });
    if (error instanceof z.ZodError) return respond(res, 400, { error: "Invalid request fields." });
    console.error("API request failed", error instanceof Error ? error.message : "Unknown error");
    return respond(res, 500, { error: "Internal server error." });
  }
}
