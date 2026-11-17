import { expect, it } from "vitest";
import { notificationForDecision } from "./domain.js";

it("keeps accepted/declined decisions distinct for in-app inbox and OS notifications", () => {
  const accepted = notificationForDecision("accepted", "s1", "r1");
  const declined = notificationForDecision("declined", "s1", "r2");
  expect(accepted.kind).toBe("request_accepted");
  expect(declined.kind).toBe("request_declined");
  expect(accepted.body).toMatch(/accepted/);
  expect(declined.body).toMatch(/declined/);
  expect(accepted.data).toEqual({ kind: "request_accepted", sessionId: "s1", requestId: "r1" });
});
