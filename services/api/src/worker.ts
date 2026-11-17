import { pool } from "./db.js";

type Claim = { id: string; notification_id: string; device_id: string; attempts: number };
type Delivery = {
  token: string; enabled: boolean; title: string; body: string; kind: string; app_route: string;
};
type ExpoTicket = { status?: "ok" | "error"; id?: string; message?: string; details?: { error?: string } };

/** Claims jobs atomically across workers. Retry on transient errors; do not expose private data in push. */
export async function processPushBatch(): Promise<number> {
  if (!process.env.EXPO_ACCESS_TOKEN) throw Error("EXPO_ACCESS_TOKEN is required for push worker.");
  const claims = await pool.query<Claim>(
    `WITH candidates AS (
      SELECT id FROM push_deliveries
      WHERE attempts < 5
        AND (status='pending' OR (status='processing' AND locked_until < NOW()))
        AND run_after <= NOW()
      ORDER BY run_after, id FOR UPDATE SKIP LOCKED LIMIT 20
    )
    UPDATE push_deliveries AS d
      SET status='processing', attempts=d.attempts+1,
          locked_until=NOW()+INTERVAL '90 seconds', updated_at=NOW()
    FROM candidates AS c WHERE d.id=c.id
    RETURNING d.id, d.notification_id, d.device_id, d.attempts`,
  );
  for (const job of claims.rows) {
    try {
      const data = await pool.query<Delivery>(
        `SELECT p.expo_push_token AS token, p.enabled, n.title, n.body, n.kind, n.app_route
        FROM push_devices p JOIN notifications n ON n.id=$1 WHERE p.id=$2`,
        [job.notification_id, job.device_id],
      );
      const item = data.rows[0];
      if (!item || !item.enabled) {
        await pool.query("UPDATE push_deliveries SET status='failed', locked_until=NULL, last_error='Device disabled' WHERE id=$1", [job.id]);
        continue;
      }
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          to: item.token,
          title: item.title,
          body: item.body,
          sound: "default",
          channelId: "tokea_updates",
          data: { route: item.app_route, kind: item.kind },
          priority: "high",
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw Error(`Push provider HTTP ${response.status}`);
      const raw = await response.json() as { data?: ExpoTicket | ExpoTicket[]; errors?: unknown[] };
      const ticket = Array.isArray(raw.data) ? raw.data[0] : raw.data;
      if (!ticket || ticket.status !== "ok" || !ticket.id) {
        if (ticket?.details?.error === "DeviceNotRegistered") {
          await pool.query("UPDATE push_devices SET enabled=false, updated_at=NOW() WHERE id=$1", [job.device_id]);
          await pool.query("UPDATE push_deliveries SET status='failed', locked_until=NULL, last_error='DeviceNotRegistered' WHERE id=$1", [job.id]);
          continue;
        }
        throw Error(ticket?.message ?? "Push provider rejected notification");
      }
      await pool.query(
        "UPDATE push_deliveries SET status='sent', ticket_id=$2, locked_until=NULL, updated_at=NOW() WHERE id=$1",
        [job.id, ticket.id],
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 250) : "Unknown push error";
      const failed = job.attempts >= 5;
      await pool.query(
        `UPDATE push_deliveries
          SET status=$2, last_error=$3, locked_until=NULL,
              run_after=NOW()+($4 * INTERVAL '1 minute'), updated_at=NOW()
          WHERE id=$1`,
        [job.id, failed ? "failed" : "pending", reason, Math.min(2 ** job.attempts, 60)],
      );
    }
  }
  return claims.rows.length;
}
