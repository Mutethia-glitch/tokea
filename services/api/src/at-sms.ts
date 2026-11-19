import { ApiError } from "./auth.js";

/** No live routing until sender approvals, billing, and provider verification are complete. */
export async function sendAfricaTalkingOtp(phone: string, code: string) {
  const username = process.env.AFRICASTALKING_USERNAME;
  const key = process.env.AFRICASTALKING_API_KEY;
  const environment = process.env.AFRICASTALKING_ENV;
  if (!key || !username || environment !== "sandbox" || username !== "sandbox") {
    throw new ApiError(503, "SMS sandbox is not configured.");
  }
  const form = new URLSearchParams({
    username, to: phone,
    message: "Tokea verification code: " + code + ". Expires in 5 minutes. Never share this code.",
  });
  let result: Response;
  try {
    result = await fetch("https://api.sandbox.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        apiKey: key,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiError(502, "SMS provider is unavailable.");
  }
  if (!result.ok) throw new ApiError(502, "SMS provider rejected the request.");
  let data: unknown;
  try { data = await result.json(); }
  catch { throw new ApiError(502, "Invalid SMS provider response."); }
  const root = data as { SMSMessageData?: { Recipients?: Array<{ statusCode?: number; status?: string }> } } | null;
  const recipient = root?.SMSMessageData?.Recipients?.[0];
  // Provider accepted/submitted, not proof of handset or simulator delivery.
  if (!recipient || ![100, 101, 102].includes(recipient.statusCode ?? -1)) {
    throw new ApiError(502, "SMS provider could not accept the message.");
  }
}
