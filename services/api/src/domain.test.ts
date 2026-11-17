import { describe, expect, it } from "vitest";
import { decisionError, notificationForDecision, type Session, type JoinRequest } from "./domain.js";

const session: Session = { hostUserId: "host", status: "open", capacity: 3 };
const request: JoinRequest = { status: "pending", partySize: 2, applicantUserId: "guest" };

describe("Server-enforced invitation decisions", () => {
  it("only allows a host to decide a request", () => {
    expect(decisionError(session, request, 0, "guest", "accepted", false)).toMatch(/host/);
    expect(decisionError(session, request, 0, "host", "accepted", false)).toBeNull();
  });
  it("prevents overbooking and blocked applicants", () => {
    expect(decisionError(session, request, 2, "host", "accepted", false)).toMatch(/seats/);
    expect(decisionError(session, request, 0, "host", "accepted", true)).toMatch(/blocked/);
  });
  it("rejects acceptance to closed or already-decided requests", () => {
    expect(decisionError({ ...session, status: "ended" }, request, 0, "host", "accepted", false)).toMatch(/not open/);
    expect(decisionError(session, { ...request, status: "declined" }, 0, "host", "accepted", false)).toMatch(/already decided/);
  });
  it("allows host to decline even when the session is full", () => {
    expect(decisionError({ ...session, status: "paused" }, request, 3, "host", "declined", false)).toBeNull();
  });
  it.each(["accepted", "declined"] as const)("generates a privacy-preserving %s notification", (status) => {
    const n = notificationForDecision(status, "session", "request");
    expect(n.kind).toBe(`request_${status}`);
    expect(n.route).toBe("/requests");
    expect(JSON.stringify(n)).not.toMatch(/coordinates|address|venue|location/i);
  });
});
