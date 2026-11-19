import { pool } from "./db.js";

type SessionRow = {
  id: string;
  title: string;
  category: string;
  neighbourhood: string;
  starts_at: Date;
  ends_at: Date;
  guest_capacity: number;
  accepted_seats: number | string;
  host_name: string;
  is_host: boolean;
};

/**
 * The native Discover feed never exposes exact locations, phone numbers,
 * identities, or sessions belonging to blocked/inactive/unverified hosts.
 * The API requires a verified-adult JWT before calling this function.
 */
export async function getDiscoverSessions(userId: string) {
  const result = await pool.query<SessionRow>([
    "SELECT s.id, s.title, s.category, s.neighbourhood,",
    "s.starts_at, s.ends_at, s.guest_capacity,",
    "u.display_name AS host_name, s.host_user_id = $1 AS is_host,",
    "COALESCE(seats.accepted_seats, 0) AS accepted_seats",
    "FROM sessions s",
    "JOIN users u ON u.id = s.host_user_id",
    "LEFT JOIN LATERAL (",
    "  SELECT COALESCE(SUM(r.party_size), 0)::int AS accepted_seats",
    "  FROM join_requests r WHERE r.session_id = s.id AND r.status = 'accepted'",
    ") seats ON true",
    "WHERE s.status = 'open' AND s.ends_at > NOW()",
    "  AND u.is_active AND u.age_verified_at IS NOT NULL",
    "  AND NOT EXISTS (",
    "    SELECT 1 FROM user_blocks b WHERE",
    "    (b.blocker_user_id = $1 AND b.blocked_user_id = s.host_user_id)",
    "    OR (b.blocked_user_id = $1 AND b.blocker_user_id = s.host_user_id)",
    "  )",
    "  AND (s.guest_capacity > COALESCE(seats.accepted_seats, 0)",
    "    OR s.host_user_id = $1",
    "    OR EXISTS (SELECT 1 FROM join_requests mine",
    "      WHERE mine.session_id = s.id AND mine.applicant_user_id = $1",
    "      AND mine.status = 'accepted'))",
    "ORDER BY s.starts_at ASC, s.created_at DESC",
    "LIMIT 50",
  ].join("\n"), [userId]);
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    neighbourhood: row.neighbourhood,
    hostName: row.host_name,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    seatsRemaining: Math.max(0, Number(row.guest_capacity) - Number(row.accepted_seats)),
    isHost: row.is_host,
  }));
}
