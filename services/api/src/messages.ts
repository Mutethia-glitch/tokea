import { z } from "zod";
import { pool } from "./db.js";
import { ApiError } from "./auth.js";
import { uuidPattern } from "./sessions.js";

export const messageSchema=z.object({text:z.string().trim().min(1).max(500)}).strict();
type MessageRow={id:string;session_id:string;author_user_id:string;author_name:string;message_text:string;created_at:Date};

async function canAccess(db:{query:typeof pool.query},actorId:string,sessionId:string,write:boolean) {
  if(!uuidPattern.test(sessionId))throw new ApiError(400,"Invalid session ID.");
  const info=await db.query<{host_user_id:string;status:string;ends_at:Date}>(
    `SELECT host_user_id,status,ends_at FROM sessions WHERE id=$1${write?" FOR UPDATE":""}`,[sessionId]);
  const session=info.rows[0];
  if(!session)throw new ApiError(404,"Session not found.");
  if(write&&(session.status!=="open"||session.ends_at.getTime()<=Date.now()))
    throw new ApiError(409,"Chat is closed for this session.");
  const block=await db.query<{blocked:boolean}>(`SELECT EXISTS(
    SELECT 1 FROM user_blocks WHERE
      (blocker_user_id=$1 AND blocked_user_id=$2) OR
      (blocker_user_id=$2 AND blocked_user_id=$1)) AS blocked`,[actorId,session.host_user_id]);
  if(block.rows[0]?.blocked)throw new ApiError(403,"This chat is unavailable.");
  if(session.host_user_id!==actorId) {
    const accepted=await db.query(`SELECT 1 FROM join_requests WHERE session_id=$1 AND applicant_user_id=$2 AND status='accepted'`,
      [sessionId,actorId]);
    if(!accepted.rowCount)throw new ApiError(403,"Accepted session membership required.");
  }
  return session.host_user_id;
}
const asDto=(m:MessageRow)=>({id:m.id,sessionId:m.session_id,authorId:m.author_user_id,
  authorName:m.author_name,text:m.message_text,createdAt:m.created_at});

export async function getMessages(actorId:string,sessionId:string) {
  const db=await pool.connect();
  try {
    await canAccess(db,actorId,sessionId,false);
    const result=await db.query<MessageRow>(`SELECT * FROM (
      SELECT m.id,m.session_id,m.author_user_id,u.display_name AS author_name,
        m.message_text,m.created_at
      FROM session_messages m JOIN users u ON u.id=m.author_user_id
      WHERE m.session_id=$1 ORDER BY m.created_at DESC,m.id DESC LIMIT 50
    ) latest ORDER BY created_at ASC,id ASC`,[sessionId]);
    return result.rows.map(asDto);
  } finally {db.release();}
}

export async function sendMessage(actorId:string,sessionId:string,text:string) {
  const db=await pool.connect();
  try {
    await db.query("BEGIN");
    const hostId=await canAccess(db,actorId,sessionId,true);
    const created=await db.query<MessageRow>(`INSERT INTO session_messages(session_id,author_user_id,message_text)
      VALUES($1,$2,$3)
      RETURNING id,session_id,author_user_id,$4::text AS author_name,message_text,created_at`,
      [sessionId,actorId,text,"You"]);
    const recipients=await db.query<{id:string}>(`SELECT candidate.id FROM (
        SELECT $2::uuid AS id UNION SELECT applicant_user_id AS id FROM join_requests
        WHERE session_id=$1 AND status='accepted'
      ) candidate
      WHERE candidate.id<>$3::uuid AND NOT EXISTS(SELECT 1 FROM user_blocks b
        WHERE (b.blocker_user_id=$3 AND b.blocked_user_id=candidate.id)
           OR (b.blocker_user_id=candidate.id AND b.blocked_user_id=$3))`,
      [sessionId,hostId,actorId]);
    for(const recipient of recipients.rows) {
      const notice=await db.query<{id:string}>(`INSERT INTO notifications
        (recipient_user_id,kind,title,body,app_route)
        VALUES($1,'new_message','New session message','You have a new message in Tokea.',$2)
        RETURNING id`,[recipient.id,`/chats/${sessionId}`]);
      await db.query(`INSERT INTO push_deliveries(notification_id,device_id)
        SELECT $1,id FROM push_devices WHERE user_id=$2 AND enabled=true
        ON CONFLICT(notification_id,device_id) DO NOTHING`,[notice.rows[0]!.id,recipient.id]);
    }
    await db.query("COMMIT");
    return asDto(created.rows[0]!);
  } catch(error) {await db.query("ROLLBACK");throw error;} finally {db.release();}
}
