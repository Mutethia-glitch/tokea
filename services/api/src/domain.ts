export type Decision = "accepted" | "declined";

export type JoinRequest = {
  status: "pending" | "accepted" | "declined" | "cancelled";
  partySize: number;
  applicantUserId: string;
};
export type Session = {
  hostUserId: string;
  status: "open" | "paused" | "ended";
  capacity: number;
};

export function decisionError(
  session: Session,
  request: JoinRequest,
  acceptedSeats: number,
  actorUserId: string,
  decision: Decision,
  blocked: boolean,
): string | null {
  if (actorUserId !== session.hostUserId) return "Only this session's host can decide requests.";
  if (request.status !== "pending") return "This request is already decided.";
  if (decision === "declined") return null;
  if (session.status !== "open") return "The session is not open.";
  if (blocked) return "The requesting user is blocked.";
  if (request.partySize < 1 || acceptedSeats + request.partySize > session.capacity) return "Not enough seats remaining.";
  return null;
}

export function notificationForDecision(decision: Decision, sessionId: string, requestId: string) {
  const accepted = decision === "accepted";
  return {
    kind: accepted ? "request_accepted" as const : "request_declined" as const,
    title: accepted ? "You're in!" : "Request update",
    body: accepted ? "Your request to join was accepted." : "Your request to join was declined.",
    route: "/requests",
    // Use IDs, not hidden venue details or the user's precise location, in push payloads.
    data: { kind: accepted ? "request_accepted" : "request_declined", sessionId, requestId },
  };
}
