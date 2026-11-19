import { afterEach, describe, expect, it, vi } from "vitest";
import { sendAfricaTalkingOtp } from "./at-sms.js";

const prior = {
  AFRICASTALKING_ENV: process.env.AFRICASTALKING_ENV,
  AFRICASTALKING_USERNAME: process.env.AFRICASTALKING_USERNAME,
  AFRICASTALKING_API_KEY: process.env.AFRICASTALKING_API_KEY,
};

afterEach(() => {
  vi.unstubAllGlobals();
  for (const [key, value] of Object.entries(prior)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("Africa's Talking sandbox adapter", () => {
  it("POSTs the OTP to the sandbox only and accepts accepted-by-provider response", async () => {
    process.env.AFRICASTALKING_ENV = "sandbox";
    process.env.AFRICASTALKING_USERNAME = "sandbox";
    process.env.AFRICASTALKING_API_KEY = "fake-test-key";
    const call = vi.fn(async (_url: string, _options: RequestInit) =>
      new Response(JSON.stringify({ SMSMessageData: { Recipients: [{ statusCode: 101, status: "Success" }] } }),
        { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", call);
    await sendAfricaTalkingOtp("+254712345678", "731942");
    const [url, options] = call.mock.calls[0]!;
    expect(url).toBe("https://api.sandbox.africastalking.com/version1/messaging");
    expect(options.method).toBe("POST");
    expect(new URLSearchParams(options.body as string).get("message")).toContain("731942");
    expect(new URLSearchParams(options.body as string).get("to")).toBe("+254712345678");
  });

  it("fails closed without sandbox credentials", async () => {
    delete process.env.AFRICASTALKING_API_KEY;
    await expect(sendAfricaTalkingOtp("+254712345678", "123456")).rejects.toMatchObject({ status: 503 });
  });

  it("rejects a non-successful recipient result despite HTTP 200", async () => {
    process.env.AFRICASTALKING_ENV = "sandbox";
    process.env.AFRICASTALKING_USERNAME = "sandbox";
    process.env.AFRICASTALKING_API_KEY = "fake-test-key";
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ SMSMessageData: { Recipients: [{ statusCode: 403, status: "InvalidPhoneNumber" }] } }),
        { status: 200 })));
    await expect(sendAfricaTalkingOtp("+254712345678", "123456")).rejects.toMatchObject({ status: 502 });
  });
});
