import { createRemoteJWKSet, jwtVerify } from "jose";
import type { IncomingHttpHeaders } from "node:http";
import { pool } from "./db.js";
import { verifyLocalAccessToken } from "./local-identity.js";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const issuer = process.env.JWT_ISSUER;
const audience = process.env.JWT_AUDIENCE;
const jwksUrl = process.env.JWT_JWKS_URL;
const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AuthenticatedUser={ id:string;email:string|null;emailVerified:boolean;ageVerified:boolean };
/** Always verify real signatures. Being signed in is independent of having passed age review. */
export async function authenticateIdentity(headers: IncomingHttpHeaders): Promise<AuthenticatedUser> {
  const local=process.env.OTP_AUTH_ENABLED==="true";
  if (!local && (!jwks || !issuer || !audience)) throw new ApiError(503, "Identity provider not configured.");
  const authorization = headers.authorization;
  if (!authorization?.startsWith("Bearer ")) throw new ApiError(401, "Authentication required.");
  let userId: string;let email:string|null=null;let emailVerified=false;
  try {
    const payload=local
      ? await verifyLocalAccessToken(authorization.slice(7))
      : (await jwtVerify(authorization.slice(7), jwks!, {
          issuer:issuer!,audience:audience!,algorithms:["RS256","ES256"],clockTolerance:5,
        })).payload;
    if (typeof payload.sub !== "string" || !uuid.test(payload.sub)) throw Error("Invalid subject");
    userId = payload.sub;
    email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
    emailVerified = payload.email_verified === true;
  } catch {
    throw new ApiError(401, "Invalid or expired access token.");
  }
  const result = await pool.query<{id:string;age_verified_at:Date|null;is_active:boolean}>(
    "SELECT id, age_verified_at, is_active FROM users WHERE id = $1", [userId],
  );
  const account = result.rows[0];
  if (!account?.is_active) throw new ApiError(403, "Account unavailable.");
  return {id:account.id,email,emailVerified,ageVerified:!!account.age_verified_at};
}
/** Use this check on EACH write operation, not only on a button in the phone app. */
export function requireVerifiedAdult(user:AuthenticatedUser) {
  if (!user.ageVerified) throw new ApiError(403, "Age verification required before hosting, joining or chatting.");
}
export async function authenticate(headers:IncomingHttpHeaders):Promise<string>{
  const user=await authenticateIdentity(headers);
  requireVerifiedAdult(user);
  return user.id;
}
export async function requireAdmin(user:AuthenticatedUser,ownerOnly=false) {
  const result=await pool.query<{role:"owner"|"reviewer"}>(
    "SELECT role FROM admin_memberships WHERE user_id=$1",[user.id]);
  if(!result.rows[0] || (ownerOnly && result.rows[0].role!=="owner"))
    throw new ApiError(403,"Administrator access required.");
  return result.rows[0].role;
}
