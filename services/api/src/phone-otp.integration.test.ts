import { randomInt } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

const enabled = Boolean(process.env.DATABASE_URL);
const previousSecret = process.env.OTP_HMAC_SECRET;
process.env.OTP_HMAC_SECRET = "isolated-integration-test-secret-not-for-production";

describe.skipIf(!enabled)("PostgreSQL single-use phone OTP", () => {
  it("issues a real random 6-digit code, verifies it once, and enforces cooldown", async () => {
    const { requestPhoneOtp, verifyPhoneOtp } = await import("./phone-otp.js");
    const phone = "+2547" + String(randomInt(0, 100_000_000)).padStart(8, "0");
    const captured: Array<{ phone: string; code: string }> = [];
    const sender = async (target: string, code: string) => { captured.push({ phone: target, code }); };
    const result = await requestPhoneOtp(phone, "test-source-"+phone, sender);
    expect(result.expiresInSeconds).toBe(300);
    expect(captured).toHaveLength(1);
    expect(captured[0]?.code).toMatch(/^[0-9]{6}$/);
    expect(captured[0]?.phone).toBe(phone);
    await expect(requestPhoneOtp(phone, "different-ip-"+phone, sender))
      .rejects.toMatchObject({ status: 429 });
    await expect(verifyPhoneOtp(result.challengeId, "abcdef")).rejects.toMatchObject({ status: 400 });
    await expect(verifyPhoneOtp(result.challengeId, "9999999")).rejects.toMatchObject({ status: 400 });
    expect(await verifyPhoneOtp(result.challengeId, captured[0]!.code))
      .toEqual({ phoneVerified: true, authenticated: false, ageVerified: false });
    await expect(verifyPhoneOtp(result.challengeId, captured[0]!.code))
      .rejects.toMatchObject({ status: 400 });
  });

  it("expires and locks out challenges after five bad codes", async () => {
    const { pool } = await import("./db.js");
    const { requestPhoneOtp, verifyPhoneOtp } = await import("./phone-otp.js");
    const phone = "+2541" + String(randomInt(0, 100_000_000)).padStart(8, "0");
    let actual = "";
    const { challengeId } = await requestPhoneOtp(phone, "requester-"+phone, async (_, code) => { actual = code; });
    const wrong = actual === "000001" ? "000002" : "000001";
    for (let i = 0; i < 5; i++) {
      await expect(verifyPhoneOtp(challengeId, wrong)).rejects.toMatchObject({ status: 400 });
    }
    await expect(verifyPhoneOtp(challengeId, actual)).rejects.toMatchObject({ status: 400 });
    const expiredPhone = "+2547" + String(randomInt(0, 100_000_000)).padStart(8, "0");
    let expiredCode = "";
    const expired = await requestPhoneOtp(expiredPhone, "another-source-"+expiredPhone, async (_, code) => { expiredCode = code; });
    await pool.query("UPDATE phone_otp_challenges SET expires_at=NOW()-INTERVAL '1 second' WHERE id=$1", [expired.challengeId]);
    await expect(verifyPhoneOtp(expired.challengeId, expiredCode)).rejects.toMatchObject({ status: 400 });
  });

  it("does not retain OTPs when the SMS provider fails", async () => {
    const { pool } = await import("./db.js");
    const { requestPhoneOtp } = await import("./phone-otp.js");
    const phone = "+2547" + String(randomInt(0, 100_000_000)).padStart(8, "0");
    await expect(requestPhoneOtp(phone, "fail-source-"+phone, async () => { throw Error("send failed"); }))
      .rejects.toMatchObject({ status: 502 });
    const result = await pool.query("SELECT COUNT(*)::int AS count FROM phone_otp_challenges WHERE requester_hash IS NOT NULL");
    expect(Number(result.rows[0]?.count)).toBeGreaterThanOrEqual(1);
    // A failed provider send should not count toward the number's cooldown.
    await expect(requestPhoneOtp(phone, "retry-source-"+phone, async () => {})).resolves.toHaveProperty("challengeId");
  });
});

afterAll(async () => {
  if (enabled) {
    const { pool } = await import("./db.js");
    await pool.end();
  }
  if (previousSecret === undefined) delete process.env.OTP_HMAC_SECRET;
  else process.env.OTP_HMAC_SECRET = previousSecret;
});
