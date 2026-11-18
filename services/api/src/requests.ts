import { z } from "zod";
import { pool } from "./db.js";
import { ApiError } from "./auth.js";
import { uuidPattern } from "./sessions.js";

export const requestSchema=z.object({
  partySize:z.number().int().min(1).max(15),
  intro:z.string().trim().max(300).default(""),
}).strict();

export async function requestToJoin(actorId:string,sessionId:string,input:z.infer<typeof requestSchema>) {
  if(!uuidPattern.test(sessionId))throw new ApiError(400,"Invalid session ID.");
  const db=await pool.connect();
  try {
    await db.query("BEGIN");
    // Approvals also take this lock; full sessions cannot receive new pending requests.
    const ses=await db.query<{host_user_id:string;status:string;guest_capacity:number;ends_at:Date}>(
      "SELECT host_user_id,status,guest_capacity,ends_at FROM sessions WHERE id=$1 FOR UPDATE",[sessionId]);
    const s=ses.rows[0];
    if(!s)throw new ApiError(404,"Session not found.");
    if(s.host_user_id===actorId)throw new ApiError(409,"You cannot request your own session.");
    if(s.status!=="open"||s.ends_at.getTime()<=Date.now())throw new ApiError(409,"Session is no longer open.");
    const block=await db.query<{blocked:boolean}>(`SELECT EXISTS(
      SELECT 1 FROM user_blocks WHERE
        (blocker_user_id=$1 AND blocked_user_id=$2) OR
        (blocker_user_id=$2 AND blocked_user_id=$1)) AS blocked`,
      [s.host_user_id,actorId]);
    if(block.rows[0]?.blocked)throw new ApiError(403,"Session unavailable.");
    const existing=await db.query(
      "SELECT 1 FROM join_requests WHERE session_id=$1 AND applicant_user_id=$2 AND status IN ('pending','accepted')",
      [sessionId,actorId]);
    if(existing.rowCount)throw new ApiError(409,"An active request already exists.");
    const seats=await db.query<{count:string}>(
      "SELECT COALESCE(SUM(party_size),0)::text AS count FROM join_requests WHERE session_id=$1 AND status='accepted'",
      [sessionId]);
    if(input.partySize > s.guest_capacity-Number(seats.rows[0]?.count??0))
      throw new ApiError(409,"Not enough seats remaining.");
    const request=await db.query<{id:string}>(`INSERT INTO join_requests
      (session_id,applicant_user_id,party_size,intro) VALUES($1,$2,$3,$4) RETURNING id`,
      [sessionId,actorId,input.partySize,input.intro]);
    const requestId=request.rows[0]!.id;
    const notice=await db.query<{id:string}>(`INSERT INTO notifications
      (recipient_user_id,kind,related_request_id,title,body,app_route)
      VALUES($1,'request_received',$2,'New join request','Someone wants to join your session.','/requests')
      RETURNING id`,[s.host_user_id,requestId]);
    const notificationId=notice.rows[0]!.id;
    await db.query(`INSERT INTO push_deliveries(notification_id,device_id)
      SELECT $1,id FROM push_devices WHERE user_id=$2 AND enabled=true
      ON CONFLICT(notification_id,device_id) DO NOTHING`,[notificationId,s.host_user_id]);
    await db.query("COMMIT");
    return {requestId,status:"pending" as const,notificationId};
  } catch(error) {
    await db.query("ROLLBACK");
    if((error as {code?:string})?.code==="23505")throw new ApiError(409,"An active request already exists.");
    throw error;
  } finally {db.release();}
}

export async function listRequests(actorId:string) {
  type Row={id:string;session_id:string;title:string;category:string;neighbourhood:string;
    host_user_id:string;host_name:string;applicant_user_id:string;applicant_name:string;
    party_size:number;intro:string;status:string;created_at:Date};
  const query=`SELECT r.id,r.session_id,s.title,s.category,s.neighbourhood,s.host_user_id,
    h.display_name AS host_name,r.applicant_user_id,a.display_name AS applicant_name,
    r.party_size,r.intro,r.status,r.created_at
    FROM join_requests r JOIN sessions s ON s.id=r.session_id
    JOIN users h ON h.id=s.host_user_id JOIN users a ON a.id=r.applicant_user_id`;
  const [incoming,sent]=await Promise.all([
    pool.query<Row>(`${query} WHERE s.host_user_id=$1 ORDER BY r.created_at DESC LIMIT 100`,[actorId]),
    pool.query<Row>(`${query} WHERE r.applicant_user_id=$1 ORDER BY r.created_at DESC LIMIT 100`,[actorId]),
  ]);
  const convert=(r:Row)=>({id:r.id,sessionId:r.session_id,title:r.title,category:r.category,
    neighbourhood:r.neighbourhood,hostId:r.host_user_id,hostName:r.host_name,
    applicantId:r.applicant_user_id,applicantName:r.applicant_name,partySize:r.party_size,
    intro:r.intro,status:r.status,createdAt:r.created_at});
  return {incoming:incoming.rows.map(convert),sent:sent.rows.map(convert)};
}

export async function cancelRequest(actorId:string,id:string) {
  if(!uuidPattern.test(id))throw new ApiError(400,"Invalid request ID.");
  const db=await pool.connect();
  try {
    await db.query("BEGIN");
    const located=await db.query<{session_id:string}>(
      "SELECT session_id FROM join_requests WHERE id=$1 AND applicant_user_id=$2",[id,actorId]);
    if(!located.rows[0])throw new ApiError(404,"Request not found.");
    await db.query("SELECT id FROM sessions WHERE id=$1 FOR UPDATE",[located.rows[0].session_id]);
    const result=await db.query("UPDATE join_requests SET status='cancelled',decided_at=NOW() WHERE id=$1 AND applicant_user_id=$2 AND status='pending' RETURNING id",[id,actorId]);
    if(!result.rowCount)throw new ApiError(409,"Only pending requests can be cancelled.");
    await db.query("COMMIT");
    return {cancelled:true};
  } catch(error) {await db.query("ROLLBACK");throw error;} finally {db.release();}
}
