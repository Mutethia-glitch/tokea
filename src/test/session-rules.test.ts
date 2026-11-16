import { describe, it, expect } from "vitest";
import { makeSeed, seatsLeft, canChat, joinError, acceptError, messageError } from "@/lib/demo-store";

describe("Tokea demo session rules", () => {
  it("counts only accepted seats", () => {
    const state = makeSeed();
    const hosted = state.sessions.find((s) => s.id === "mine")!;
    expect(seatsLeft(hosted, state.requests)).toBe(2);
  });
  it("rejects a full session and joining one's own session", () => {
    const state = makeSeed();
    expect(joinError(state, "s3", 1)).toMatch(/full/i);
    expect(joinError(state, "mine", 1)).toMatch(/own session/i);
  });
  it("respects individual/group invitation settings", () => {
    const state = makeSeed();
    const groupOnly = state.sessions.find((s) => s.id === "s1")!;
    groupOnly.openTo = "groups";
    expect(joinError(state, "s1", 1)).toMatch(/groups/i);
    expect(joinError(state, "s1", 2)).toBeNull();
  });
  it("does not allow acceptance beyond capacity", () => {
    const state = makeSeed();
    const hosted = state.sessions.find((s) => s.id === "mine")!;
    hosted.capacity = 1;
    expect(acceptError(state, "r3")).toMatch(/not enough seats/i);
  });
  it("does not accept requests to ended or paused sessions", () => {
    const state = makeSeed();
    const hosted = state.sessions.find((s) => s.id === "mine")!;
    hosted.status = "ended";
    expect(acceptError(state, "r3")).toMatch(/no longer accepting/i);
    hosted.status = "paused";
    expect(acceptError(state, "r3")).toMatch(/no longer accepting/i);
  });
  it("rejects a blocked applicant", () => {
    const state = makeSeed();
    state.blocked.push("zawadi");
    expect(acceptError(state, "r3")).toMatch(/blocked/i);
  });
  it("limits chat to the host and approved guests", () => {
    const state = makeSeed();
    const session = state.sessions.find((s) => s.id === "s2")!;
    expect(canChat(session, state.requests)).toBe(true);
    expect(messageError(state, "s1")).toMatch(/accepted/i);
    expect(messageError(state, "s2")).toBeNull();
  });
  it("locks a chat when its session is ended or the host is blocked", () => {
    const state = makeSeed();
    const session = state.sessions.find((s) => s.id === "s2")!;
    session.status = "ended";
    expect(messageError(state, "s2")).toMatch(/unavailable/i);
    session.status = "open";
    state.blocked.push("wanjiru");
    expect(messageError(state, "s2")).toMatch(/blocked/i);
  });
});
