import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { route } from "./routes.js";

const originalFlag = process.env.ENABLE_PHONE_OTP;
const originalEnv = process.env.AFRICASTALKING_ENV;
afterEach(() => {
  if (originalFlag === undefined) delete process.env.ENABLE_PHONE_OTP;
  else process.env.ENABLE_PHONE_OTP = originalFlag;
  if (originalEnv === undefined) delete process.env.AFRICASTALKING_ENV;
  else process.env.AFRICASTALKING_ENV = originalEnv;
});

describe("Sandbox OTP feature gate", () => {
  it("denies public start and verify endpoints when disabled", async () => {
    process.env.ENABLE_PHONE_OTP = "false";
    process.env.AFRICASTALKING_ENV = "sandbox";
    const server = createServer((req, res) => { void route(req, res); });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw Error("Unexpected test server address.");
      for (const path of ["/v1/auth/phone/start", "/v1/auth/phone/verify"]) {
        const response = await fetch("http://127.0.0.1:" + address.port + path, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
        });
        expect(response.status).toBe(503);
      }
    } finally {
      await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    }
  });
});
