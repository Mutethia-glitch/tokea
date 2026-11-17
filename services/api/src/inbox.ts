import { pool } from "./db.js";
import { ApiError } from "./auth.js";

export async function getInbox(userId: string) {
  const result = await pool.query<{
    id: string; kind: string; title: string; body: string; app_route: string;
    read_at: Date | null; created_at: Date;
  }>(
    `SELECT id, kind, title, body, app_route, read_at, created_at
      FROM notifications WHERE recipient_user_id=$1
      ORDER BY created_at DESC LIMIT 50`, [userId],
  );
  return result.rows.map((row) => ({
    id: row.id, kind: row.kind, title: row.title, body: row.body,
    route: row.app_route, readAt: row.read_at, createdAt: row.created_at,
  }));
}

export async function markInboxRead(userId: string, notificationId: string) {
  const result = await pool.query(
    "UPDATE notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND recipient_user_id=$2 RETURNING id",
    [notificationId, userId],
  );
  if (!result.rowCount) throw new ApiError(404, "Notification not found.");
  return { updated: true };
}
