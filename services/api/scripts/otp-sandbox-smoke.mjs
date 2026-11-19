/**
 * Local-only operator test. Talks to the Tokea API on localhost. No Africa's
 * Talking credentials are needed in this script or the native app.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const base = new URL(process.env.TOKEA_LOCAL_API_URL || "http://127.0.0.1:4400");
if (!["127.0.0.1", "localhost"].includes(base.hostname) || !["http:", "https:"].includes(base.protocol)) {
  throw Error("This private smoke-test script may only call a localhost API.");
}
const rl = createInterface({ input: stdin, output: stdout });
async function post(path, body) {
  const response = await fetch(new URL(path, base), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12_000),
  });
  const data = await response.json();
  if (!response.ok) throw Error("Local API returned status " + response.status + ": " + (data.error || "request failed"));
  return data;
}
try {
  const phone = (await rl.question("Enter the number registered in the simulator (+254...): ")).trim();
  if (!/^\+254[17][0-9]{8}$/.test(phone)) throw Error("Enter a valid Kenyan simulator number.");
  const challenge = await post("/v1/auth/phone/start", { phone });
  if (!challenge.challengeId) throw Error("API did not issue a challenge.");
  console.log("Tokea submitted an OTP request. Check the Africa's Talking simulator messages.");
  const code = (await rl.question("Enter the six-digit code received: ")).trim();
  if (!/^[0-9]{6}$/.test(code)) throw Error("Code must have six digits.");
  const proof = await post("/v1/auth/phone/verify", { challengeId: challenge.challengeId, code });
  if (proof.phoneVerified !== true || proof.authenticated !== false || proof.ageVerified !== false) {
    throw Error("Unexpected verification response.");
  }
  console.log("Sandbox phone challenge verified. This is not login or age assurance.");
} finally {
  rl.close();
}
