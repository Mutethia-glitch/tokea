import { createRemoteJWKSet, jwtVerify } from "jose";
import type { IncomingHttpHeaders } from "node:http";
import { pool } from "./db.js";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const issuer = process.env.JWT_ISSUER;
const audience = process.env.JWT_AUDIENCE;
const jwksUrl = process.env.JWT_JWKS_URL;
const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Authentication is intentionally real-JWKS-only; no demo/dev bypass tokens. */
export async function authenticate(headers: IncomingHttpHeaders): Promise<string> {
  if (!jwks || !issuer || !audience) throw new ApiError(503, "Identity provider not configured.");
  const authorization = headers.authorization;
  if (!authorization?.startsWith("Bearer ")) throw new ApiError(401, "Authentication required.");
  let userId: string;
  try {
    const { payload } = await jwtVerify(authorization.slice(7), jwks, {
      issuer, audience, algorithms: ["RS256", "ES256"], clockTolerance: 5,
    });
    if (typeof payload.sub !== "string" || !uuid.test(payload.sub)) throw Error("Invalid subject");
    userId = payload.sub;
  } catch {
    throw new ApiError(401, "Invalid or expired access token.");
  }
  const result = await pool.query<{ id: string; age_verified_at: Date | null; is_active: boolean }>(
    "SELECT id, age_verified_at, is_active FROM users WHERE id = $1", [userId],
  );
  const account = result.rows[0];
  if (!account?.is_active) throw new ApiError(403, "Account unavailable.");
  if (!account.age_verified_at) throw new ApiError(403, "Adult age verification required.");
  return account.id;
}
