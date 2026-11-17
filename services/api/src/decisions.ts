import { pool } from "./db.js";
import { ApiError } from "./auth.js";
import { decisionError, notificationForDecision, type Decision } from "./domain.js";

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function decideJoinRequest(actorId: string, sessionId: string, requestId: string, decision: Decision) {
  if (!isUuid(sessionId) || !isUuid(requestId)) throw new ApiError(400, "Invalid request or session ID.");
  const connection = await pool.connect();
  try {
    await connection.query("BEGIN");
    // Locking the session serializes concurrent approvals to prevent overbooking.
    const sessionResult = await connection.query<{
      id: string; host_user_id: string; status: "open" | "paused" | "ended"; guest_capacity: number;
    }>("SELECT id, host_user_id, status, guest_capacity FROM sessions WHERE id=$1 FOR UPDATE", [sessionId]);
    const session = sessionResult.rows[0];
    if (!session) throw new ApiError(404, "Session not found.");
    if (session.host_user_id !== actorId) throw new ApiError(403, "Only the host can decide a request.");

    const requestResult = await connection.query<{
      id: string; applicant_user_id: string; status: "pending" | "accepted" | "declined" | "cancelled";
      party_size: number;
    }>("SELECT id, applicant_user_id, party_size, status FROM join_requests WHERE id=$1 AND session_id=$2 FOR UPDATE", [requestId, sessionId]);
    const request = requestResult.rows[0];
    if (!request) throw new ApiError(404, "Request not found.");
    if (request.status === decision) {
      await connection.query("COMMIT");
      return { decision, alreadyProcessed: true };
    }

    const [seats, blockResult] = await Promise.all([
      connection.query<{ count: string }>("SELECT COALESCE(SUM(party_size),0)::text AS count FROM join_requests WHERE session_id=$1 AND status='accepted'", [sessionId]),
      connection.query<{ blocked: boolean }>(
        "SELECT EXISTS (SELECT 1 FROM user_blocks WHERE (blocker_user_id=$1 AND blocked_user_id=$2) OR (blocker_user_id=$2 AND blocked_user_id=$1)) AS blocked",
        [actorId, request.applicant_user_id],
      ),
    ]);
    const error = decisionError({
      hostUserId: session.host_user_id, capacity: session.guest_capacity, status: session.status,
    }, {
      applicantUserId: request.applicant_user_id, partySize: request.party_size, status: request.status,
    }, Number(seats.rows[0]?.count ?? 0), actorId, decision, !!blockResult.rows[0]?.blocked);
    if (error) throw new ApiError(409, error);

    await connection.query("UPDATE join_requests SET status=$1, decided_at=NOW() WHERE id=$2", [decision, requestId]);
    const notice = notificationForDecision(decision, sessionId, requestId);
    const inserted = await connection.query<{ id: string }>(
      `INSERT INTO notifications (recipient_user_id, kind, related_request_id, title, body, app_route)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT(kind, related_request_id) DO UPDATE SET title = EXCLUDED.title
       RETURNING id`,
      [request.applicant_user_id, notice.kind, requestId, notice.title, notice.body, notice.route],
    );
    const notificationId = inserted.rows[0]?.id;
    if (!notificationId) throw new Error("Could not create notification.");
    // Atomic enqueue: a recorded inbox event can't be lost if the push worker crashes.
    await connection.query(
      `INSERT INTO push_deliveries (notification_id, device_id)
       SELECT $1, id FROM push_devices WHERE user_id=$2 AND enabled=true
       ON CONFLICT (notification_id, device_id) DO NOTHING`,
      [notificationId, request.applicant_user_id],
    );
    await connection.query("COMMIT");
    return { decision, notificationId, alreadyProcessed: false };
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}
