import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { pool } from "./db.js";
import { ApiError } from "./auth.js";
import { sendAfricaTalkingOtp } from "./at-sms.js";

export type SendOtp = (phone: string, code: string) => Promise<void>;

const phonePattern = /^\+254[17][0-9]{8}$/;
const codePattern = /^[0-9]{6}$/;
const ttlSeconds = 300;

function hmac(label: string, value: string) {
  const secret = process.env.OTP_HMAC_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new ApiError(503, "Phone verification is not configured.");
  }
  return createHmac("sha256", secret).update(label + ":" + value).digest("hex");
}

export function validKenyanMobile(phone: string) {
  return phonePattern.test(phone);
}

export async function requestPhoneOtp(phone: string, requester: string, send: SendOtp = sendAfricaTalkingOtp) {
  if (!validKenyanMobile(phone)) throw new ApiError(400, "Enter a Kenyan mobile number starting with +254.");
  if (!requester) throw new ApiError(503, "Request source unavailable.");
  // Secrets must be configured before any DB write or SMS dispatch.
  const phoneHash = hmac("phone", phone);
  const requesterHash = hmac("requester", requester);
  const challengeId = randomUUID();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = hmac("otp:" + challengeId, code);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serializes issuance per number across all API replicas.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [phoneHash]);
    const recent = await client.query<{
      total_phone: string; total_requester: string; last_phone: Date | null;
    }>(
      "SELECT " +
      "(SELECT COUNT(*) FROM phone_otp_challenges WHERE phone_hash=$1 AND created_at > NOW() - INTERVAL '1 hour') AS total_phone, " +
      "(SELECT COUNT(*) FROM phone_otp_challenges WHERE requester_hash=$2 AND created_at > NOW() - INTERVAL '1 hour') AS total_requester, " +
      "(SELECT MAX(created_at) FROM phone_otp_challenges WHERE phone_hash=$1) AS last_phone",
      [phoneHash, requesterHash],
    );
    const limit = recent.rows[0];
    if (!limit ||
      Number(limit.total_phone) >= 5 || Number(limit.total_requester) >= 12 ||
      (limit.last_phone && Date.now() - new Date(limit.last_phone).getTime() < 60_000)) {
      throw new ApiError(429, "Please wait before requesting another code.");
    }
    await client.query(
      "INSERT INTO phone_otp_challenges (id,phone_hash,requester_hash,code_hash,expires_at) " +
      "VALUES ($1,$2,$3,$4,NOW() + INTERVAL '5 minutes')",
      [challengeId, phoneHash, requesterHash, codeHash],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally { client.release(); }

  try {
    await send(phone, code);
  } catch (error) {
    // Allow retry after a failed provider attempt without disclosing recipient details.
    await pool.query("DELETE FROM phone_otp_challenges WHERE id=$1", [challengeId]);
    if (error instanceof ApiError && error.status === 503) throw error;
    throw new ApiError(502, "Unable to send a verification code.");
  }
  return { challengeId, expiresInSeconds: ttlSeconds };
}

/** Proof of phone possession only. Never returns or mints an authentication JWT. */
export async function verifyPhoneOtp(challengeId: string, code: string) {
  if (!codePattern.test(code)) throw new ApiError(400, "Invalid or expired code.");
  const client = await pool.connect();
  let verified = false;
  try {
    await client.query("BEGIN");
    const result = await client.query<{
      code_hash: string; attempts: number; expired: boolean; verified: boolean;
    }>(
      "SELECT code_hash, attempts, expires_at <= NOW() AS expired, verified_at IS NOT NULL AS verified " +
      "FROM phone_otp_challenges WHERE id=$1 FOR UPDATE",
      [challengeId],
    );
    const row = result.rows[0];
    if (row && !row.expired && !row.verified && row.attempts < 5) {
      const expected = Buffer.from(row.code_hash, "hex");
      const received = Buffer.from(hmac("otp:" + challengeId, code), "hex");
      verified = expected.length === received.length && timingSafeEqual(expected, received);
      if (verified) {
        await client.query("UPDATE phone_otp_challenges SET verified_at=NOW() WHERE id=$1", [challengeId]);
      } else {
        await client.query("UPDATE phone_otp_challenges SET attempts=attempts+1 WHERE id=$1", [challengeId]);
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
  if (!verified) throw new ApiError(400, "Invalid or expired code.");
  return { phoneVerified: true, authenticated: false, ageVerified: false };
}
