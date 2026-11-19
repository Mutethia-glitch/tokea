/** Public proof-of-phone API: it never issues login credentials or verifies age. */
export type PhoneChallenge = { challengeId: string; expiresInSeconds: number };
export type PhoneProof = { phoneVerified: true; authenticated: false; ageVerified: false };

async function postPhoneProof<T>(path: string, payload: object): Promise<T> {
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (!base?.startsWith("https://")) throw Error("Tokea phone verification is not connected yet.");
  let response: Response;
  try {
    response = await fetch(base.replace(/\/$/, "") + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw Error("Unable to contact Tokea. Check your connection.");
  }
  if (response.status === 429) throw Error("Too many requests. Please try again later.");
  if (response.status === 503) throw Error("Phone verification is not available yet.");
  if (response.status === 400) throw Error("Invalid, expired or already used verification code or number.");
  if (!response.ok) throw Error("Verification request failed. Try again later.");
  return response.json() as Promise<T>;
}
export function startPhoneProof(phone: string) {
  return postPhoneProof<PhoneChallenge>("/v1/auth/phone/start", { phone });
}
export function confirmPhoneProof(challengeId: string, code: string) {
  return postPhoneProof<PhoneProof>("/v1/auth/phone/verify", { challengeId, code });
}
