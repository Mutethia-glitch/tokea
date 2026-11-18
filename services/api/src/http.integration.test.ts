import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const enabled = Boolean(process.env.DATABASE_URL);
const issuer = "urn:tokea:local-http-integration";
const audience = "tokea-api";
const hostId = randomUUID(), applicantId = randomUUID(), unverifiedId = randomUUID();
let jwksServer: Server | undefined;
let apiServer: Server | undefined;
let apiBase = "";
let hostToken = "", applicantToken = "", unverifiedToken = "";
let sessionId = "", requestId = "";
let dbPool: (typeof import("./db.js"))["pool"] | undefined;

async function close(server?: Server) {
  if (!server) return;
  await new Promise<void>((resolve, reject) => server.close((e) => e ? reject(e) : resolve()));
}

async function request(path: string, token?: string, method = "GET", body?: object) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const response = await fetch(apiBase + path, {
    method, headers, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await response.json() as Record<string, any>;
  return { status: response.status, json };
}

describe.skipIf(!enabled)("Signed-JWT authenticated HTTP lifecycle on loopback", () => {
  beforeAll(async () => {
    // Ephemeral JWKS and API servers are TEST-ONLY, bound exclusively to loopback.
    // This does NOT provide a production login, SMS OTP or age-verification bypass.
    const { privateKey, publicKey } = await generateKeyPair("RS256", { modulusLength: 2048 });
    const key = { ...await exportJWK(publicKey), kid: "local-integration-only", alg: "RS256", use: "sig" };
    jwksServer = createServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ keys: [key] }));
    });
    await new Promise<void>(resolve => jwksServer!.listen(0, "127.0.0.1", resolve));
    const jwksAddress = jwksServer.address();
    if (!jwksAddress || typeof jwksAddress === "string") throw Error("Unexpected JWKS server address.");
    process.env.JWT_JWKS_URL = `http://127.0.0.1:${jwksAddress.port}/jwks`;
    process.env.JWT_ISSUER = issuer;
    process.env.JWT_AUDIENCE = audience;
    const sign = (id: string) => new SignJWT({}).setProtectedHeader({ alg: "RS256", kid: key.kid })
      .setSubject(id).setIssuer(issuer).setAudience(audience)
      .setIssuedAt().setExpirationTime("5m").sign(privateKey);
    [hostToken, applicantToken, unverifiedToken] = await Promise.all(
      [hostId, applicantId, unverifiedId].map(sign),
    );
    const { pool } = await import("./db.js");
    dbPool = pool;
    await pool.query(
      `INSERT INTO users(id,display_name,age_verified_at) VALUES
       ($1,'Test host',NOW()),($2,'Test applicant',NOW()),($3,'Unverified test account',NULL)`,
      [hostId,applicantId,unverifiedId],
    );
    // Import only after setting JWT configuration; test tokens are signed, not bypassed.
    const { route } = await import("./routes.js");
    apiServer = createServer((req,res) => { void route(req,res); });
    await new Promise<void>(resolve => apiServer!.listen(0, "127.0.0.1", resolve));
    const apiAddress = apiServer.address();
    if (!apiAddress || typeof apiAddress === "string") throw Error("Unexpected API server address.");
    apiBase = `http://127.0.0.1:${apiAddress.port}`;
  }, 30_000);

  afterAll(async () => {
    await close(apiServer);
    if (dbPool) await dbPool.end();
    await close(jwksServer);
    delete process.env.JWT_JWKS_URL;
    delete process.env.JWT_ISSUER;
    delete process.env.JWT_AUDIENCE;
  });

  it("serves loopback health and rejects missing, invalid and non-adult credentials", async () => {
    expect((await request("/healthz")).status).toBe(200);
    expect((await request("/v1/sessions")).status).toBe(401);
    const invalid = await request("/v1/sessions", "not-a-signed-jwt");
    expect(invalid.status).toBe(401);
    const unverified = await request("/v1/sessions", unverifiedToken);
    expect(unverified.status).toBe(403);
    expect(unverified.json.error).toMatch(/Adult age verification required/i);
  });

  it("creates and discovers a session with a genuinely verified signature", async () => {
    const created = await request("/v1/sessions", hostToken, "POST", {
      title: "Muratina conversation at a public venue",
      category: "Muratina",
      neighbourhood: "Kileleshwa",
      guestCapacity: 2,
      startsAt: new Date(Date.now() + 3_600_000).toISOString(),
      endsAt: new Date(Date.now() + 7_200_000).toISOString(),
    });
    expect(created.status).toBe(201);
    sessionId = String(created.json.id);
    expect(sessionId).toMatch(/^[0-9a-f-]{36}$/);
    const discovered = await request("/v1/sessions?category=Muratina", applicantToken);
    expect(discovered.status).toBe(200);
    expect((discovered.json.sessions as {id:string}[]).some(s => s.id === sessionId)).toBe(true);
    const hostView = await request(`/v1/sessions/${sessionId}`, hostToken);
    expect(hostView.json.session.isHost).toBe(true);
    const guestView = await request(`/v1/sessions/${sessionId}`, applicantToken);
    expect(guestView.json.session.isHost).toBe(false);
    expect(guestView.json.session).not.toHaveProperty("latitude");
  });

  it("creates a request, restricts preapproval chat, and authorizes host decisions only", async () => {
    const joined = await request(`/v1/sessions/${sessionId}/requests`, applicantToken, "POST", {
      partySize: 1, intro: "I'd like to join.",
    });
    expect(joined.status).toBe(201);
    requestId = String(joined.json.requestId);
    const inbox = await request("/v1/notifications", hostToken);
    expect((inbox.json.notifications as {kind:string}[]).some(n=>n.kind==="request_received")).toBe(true);

    expect((await request(`/v1/sessions/${sessionId}/messages`,applicantToken)).status).toBe(403);
    expect((await request(`/v1/sessions/${sessionId}/requests/${requestId}/decision`,
      applicantToken,"POST",{decision:"accepted"})).status).toBe(403);
    expect((await request(`/v1/sessions/${sessionId}/requests/${requestId}/decision`,
      hostToken,"POST",{decision:"accepted"})).status).toBe(200);
    const applicantInbox = await request("/v1/notifications", applicantToken);
    expect((applicantInbox.json.notifications as {kind:string}[]).some(n=>n.kind==="request_accepted")).toBe(true);
    expect((await request(`/v1/sessions/${sessionId}/requests/${requestId}/decision`,
      hostToken,"POST",{decision:"accepted"})).json.alreadyProcessed).toBe(true);
  });

  it("allows approved chat only, with private text excluded from notifications", async () => {
    const sent = await request(`/v1/sessions/${sessionId}/messages`,applicantToken,"POST",{
      text:"Our private meetup message.",
    });
    expect(sent.status).toBe(201);
    const history = await request(`/v1/sessions/${sessionId}/messages`,hostToken);
    expect(history.status).toBe(200);
    expect((history.json.messages as {text:string}[]).some(m=>m.text==="Our private meetup message.")).toBe(true);
    expect((await request(`/v1/sessions/${sessionId}/messages`,unverifiedToken)).status).toBe(403);
    const inbox = await request("/v1/notifications", hostToken);
    expect((inbox.json.notifications as {kind:string}[]).some(n=>n.kind==="new_message")).toBe(true);
    expect(JSON.stringify(inbox.json)).not.toContain("Our private meetup message.");
  });
});
