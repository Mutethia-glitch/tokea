import { z } from "zod";
import { pool } from "./db.js";
import { ApiError } from "./auth.js";
import { DRINK_CATEGORIES, NEIGHBOURHOODS } from "./catalogue.js";

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const createSessionSchema = z.object({
  title: z.string().trim().min(4).max(140),
  category: z.enum(DRINK_CATEGORIES),
  neighbourhood: z.enum(NEIGHBOURHOODS),
  guestCapacity: z.number().int().min(1).max(15),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
}).strict().refine((s) => {
  const start=Date.parse(s.startsAt), end=Date.parse(s.endsAt), now=Date.now();
  return start > now + 4*60_000 && start < now + 31*24*60*60_000
    && end >= start + 15*60_000 && end <= start + 8*60*60_000;
}, {message:"Schedule a session within 31 days, lasting 15 minutes to 8 hours."});

export const discoverSchema=z.object({
  category:z.enum(DRINK_CATEGORIES).optional(),
  neighbourhood:z.enum(NEIGHBOURHOODS).optional(),
}).strict();

type SessionRow = {
  id:string; host_user_id:string; host_name:string; host_has_photo:boolean; host_photo_updated_at:Date|null; title:string; category:string;
  neighbourhood:string; guest_capacity:number; status:"open"|"paused"|"ended";
  starts_at:Date; ends_at:Date; accepted_seats:string;
};
const select = `SELECT s.id,s.host_user_id,u.display_name AS host_name,s.title,
  s.category,s.neighbourhood,s.guest_capacity,s.status,s.starts_at,s.ends_at,
  (u.avatar_file_key IS NOT NULL) AS host_has_photo,u.avatar_updated_at AS host_photo_updated_at,
  COALESCE((SELECT SUM(party_size) FROM join_requests r
    WHERE r.session_id=s.id AND r.status='accepted'),0)::text AS accepted_seats
  FROM sessions s JOIN users u ON u.id=s.host_user_id`;
const dto=(s:SessionRow,actorId:string)=>({
  isHost:s.host_user_id===actorId,
  id:s.id,hostId:s.host_user_id,hostName:s.host_name,
  hostHasPhoto:s.host_has_photo,hostPhotoVersion:s.host_photo_updated_at,title:s.title,
  category:s.category,neighbourhood:s.neighbourhood,
  guestCapacity:s.guest_capacity,seatsLeft:Math.max(0,s.guest_capacity-Number(s.accepted_seats)),
  status:s.status,startsAt:s.starts_at,endsAt:s.ends_at,
});

export async function discoverSessions(actorId:string,filters:z.infer<typeof discoverSchema>) {
  const found=await pool.query<SessionRow>(`${select}
    WHERE s.status='open' AND s.ends_at>NOW()
      AND ($2::text IS NULL OR s.category=$2)
      AND ($3::text IS NULL OR s.neighbourhood=$3)
      AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE
        (b.blocker_user_id=$1 AND b.blocked_user_id=s.host_user_id) OR
        (b.blocker_user_id=s.host_user_id AND b.blocked_user_id=$1))
    ORDER BY s.starts_at ASC,s.created_at DESC LIMIT 50`,
    [actorId,filters.category??null,filters.neighbourhood??null]);
  return found.rows.map(s=>dto(s,actorId));
}

export async function getSession(actorId:string,id:string) {
  if(!uuidPattern.test(id))throw new ApiError(400,"Invalid session ID.");
  const found=await pool.query<SessionRow>(`${select}
    WHERE s.id=$1 AND s.status='open' AND s.ends_at>NOW()
    AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE
      (b.blocker_user_id=$2 AND b.blocked_user_id=s.host_user_id) OR
      (b.blocker_user_id=s.host_user_id AND b.blocked_user_id=$2))`,[id,actorId]);
  if(!found.rows[0])throw new ApiError(404,"Session not available.");
  return dto(found.rows[0],actorId);
}

export async function createSession(actorId:string,input:z.infer<typeof createSessionSchema>) {
  // A trusted identity provider and verified-adult DB check precede all protected routes.
  const inserted=await pool.query<{id:string}>(`INSERT INTO sessions(
      host_user_id,title,category,neighbourhood,guest_capacity,starts_at,ends_at)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [actorId,input.title,input.category,input.neighbourhood,input.guestCapacity,input.startsAt,input.endsAt]);
  return {id:inserted.rows[0]!.id};
}
