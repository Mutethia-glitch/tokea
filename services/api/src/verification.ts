import { pool } from "./db.js";
import { ApiError, type AuthenticatedUser, requireAdmin } from "./auth.js";
import { savePhoto, removePhoto, readPhoto } from "./private-photos.js";
import { enqueueNotice } from "./notice.js";
import { z } from "zod";

const uuid=z.uuid();
type ReviewCase={
  id:string;user_id:string;status:"draft"|"pending"|"verified"|"declined"|"expired";
  id_file_key:string|null;selfie_file_key:string|null;created_at:Date;expires_at:Date;
  submitted_at:Date|null;reviewed_at:Date|null;reviewed_by:string|null;decline_reason:string|null;consent_at:Date|null;
};
export const decisionSchema=z.object({
  decision:z.enum(["verified","declined"]),
  reason:z.string().trim().min(5).max(240).optional(),
}).strict().refine(x=>x.decision!=="declined"||!!x.reason,{message:"Declining a review requires a reason."});
const REVIEW_TEXT="Your documents were received. Our support team aims to review within 5 minutes during staffed hours; timing is not guaranteed.";
export async function getVerificationStatus(userId:string) {
  const [account,result]=await Promise.all([
    pool.query<{age_verified_at:Date|null}>("SELECT age_verified_at FROM users WHERE id=$1",[userId]),
    pool.query<ReviewCase>("SELECT * FROM age_verification_cases WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",[userId]),
  ]);
  const latest=result.rows[0];
  return {
    verified:!!account.rows[0]?.age_verified_at,
    status:account.rows[0]?.age_verified_at?"verified":latest?.status??"not_submitted",
    submittedAt:latest?.submitted_at??null,expiresAt:latest?.expires_at??null,
    reason:latest?.decline_reason??null,
    canUpload:!account.rows[0]?.age_verified_at&&(!latest||["draft","declined","expired"].includes(latest.status)),
    reviewTarget:"We aim to review within 5 minutes during staffed hours. This is not guaranteed.",
  };
}
export async function uploadDocument(user:AuthenticatedUser,kind:"id"|"selfie",bytes:Buffer,consented:boolean) {
  if(!consented)throw new ApiError(400,"Please agree to temporary identity-photo review before uploading.");
  if(user.ageVerified)throw new ApiError(409,"Account already age verified.");
  const fileKey=await savePhoto(bytes,kind);
  const db=await pool.connect();
  let old:string|null=null;
  try {
    await db.query("BEGIN");
    const recent=await db.query<ReviewCase>("SELECT * FROM age_verification_cases WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1 FOR UPDATE",[user.id]);
    let row=recent.rows[0];
    if(row?.status==="pending")throw new ApiError(409,"Age review is already in progress.");
    if(row?.status==="verified")throw new ApiError(409,"Review already completed.");
    if(row?.status==="draft"&&row.expires_at.getTime()<=Date.now()) {
      await db.query("UPDATE age_verification_cases SET status='expired' WHERE id=$1",[row.id]);
      row=undefined;
    }
    if(!row||row.status!=="draft") {
      const result=await db.query<ReviewCase>(
        "INSERT INTO age_verification_cases(user_id) VALUES($1) RETURNING *",[user.id]);
      row=result.rows[0]!;
    }
    old=kind==="id"?row.id_file_key:row.selfie_file_key;
    const column=kind==="id"?"id_file_key":"selfie_file_key";
    await db.query(`UPDATE age_verification_cases SET ${column}=$1,consent_at=COALESCE(consent_at,NOW()) WHERE id=$2 AND status='draft'`,[fileKey,row.id]);
    if(old)await db.query("INSERT INTO verification_photo_deletions(file_key) VALUES($1) ON CONFLICT DO NOTHING",[old]);
    await db.query("COMMIT");
    return {received:true,kind};
  } catch(e) {
    await db.query("ROLLBACK");
    await removePhoto(fileKey).catch(()=>{});
    throw e;
  }finally{db.release();}
}
export async function submitVerification(user:AuthenticatedUser) {
  if(user.ageVerified)throw new ApiError(409,"Already verified.");
  const db=await pool.connect();
  try{
    await db.query("BEGIN");
    const found=await db.query<ReviewCase>("SELECT * FROM age_verification_cases WHERE user_id=$1 AND status='draft' FOR UPDATE",[user.id]);
    const row=found.rows[0];
    if(!row)throw new ApiError(409,"Upload your ID and selfie first.");
    if(!row.id_file_key||!row.selfie_file_key)throw new ApiError(409,"Both a clear ID photo and a clear selfie are required.");
    if(!row.consent_at)throw new ApiError(409,"Your consent to temporary photo review is required.");
    if(row.expires_at.getTime()<=Date.now())throw new ApiError(410,"Your uploads expired. Please start again.");
    await db.query("UPDATE age_verification_cases SET status='pending',submitted_at=NOW() WHERE id=$1",[row.id]);
    await enqueueNotice(db,user.id,"verification_submitted","Age verification submitted",REVIEW_TEXT,"/verification");
    await db.query("COMMIT");
    return {status:"pending" as const,message:REVIEW_TEXT};
  }catch(e){await db.query("ROLLBACK");throw e;}finally{db.release();}
}
export async function listReviewQueue(admin:AuthenticatedUser) {
  await requireAdmin(admin);
  const r=await pool.query<{id:string;user_id:string;display_name:string;submitted_at:Date;expires_at:Date}>(
    `SELECT c.id,c.user_id,u.display_name,c.submitted_at,c.expires_at FROM age_verification_cases c
      JOIN users u ON u.id=c.user_id WHERE c.status='pending' AND c.expires_at>NOW()
      ORDER BY c.submitted_at ASC LIMIT 100`);
  return r.rows.map(x=>({id:x.id,userId:x.user_id,displayName:x.display_name,
    submittedAt:x.submitted_at,expiresAt:x.expires_at}));
}
export async function viewReviewPhoto(admin:AuthenticatedUser,id:string,kind:"id"|"selfie") {
  await requireAdmin(admin);
  if(!uuid.safeParse(id).success)throw new ApiError(400,"Invalid verification ID.");
  const r=await pool.query<ReviewCase>(
    "SELECT * FROM age_verification_cases WHERE id=$1 AND status='pending' AND expires_at>NOW()",[id]);
  const row=r.rows[0];
  if(!row)throw new ApiError(404,"Review is no longer available.");
  const file=kind==="id"?row.id_file_key:row.selfie_file_key;
  if(!file)throw new ApiError(404,"Photo missing.");
  return readPhoto(file);
}
export async function decideVerification(admin:AuthenticatedUser,id:string,decision:z.infer<typeof decisionSchema>) {
  await requireAdmin(admin);
  if(!uuid.safeParse(id).success)throw new ApiError(400,"Invalid verification ID.");
  const db=await pool.connect();
  let idKey:string|null=null,selfieKey:string|null=null;
  try{
    await db.query("BEGIN");
    const r=await db.query<ReviewCase>("SELECT * FROM age_verification_cases WHERE id=$1 FOR UPDATE",[id]);
    const c=r.rows[0];
    if(!c)throw new ApiError(404,"Submission not found.");
    if(c.status!=="pending"||c.expires_at.getTime()<=Date.now())
      throw new ApiError(409,"This case is closed, expired or already reviewed. Final decisions cannot be changed.");
    const result=await db.query(`UPDATE age_verification_cases
      SET status=$1,reviewed_by=$2,reviewed_at=NOW(),decline_reason=$3,
          id_file_key=NULL,selfie_file_key=NULL
      WHERE id=$4 AND status='pending' RETURNING id`,
      [decision.decision,admin.id,decision.reason??null,id]);
    if(!result.rowCount)throw new ApiError(409,"Already reviewed.");
    if(decision.decision==="verified")
      await db.query("UPDATE users SET age_verified_at=NOW() WHERE id=$1 AND age_verified_at IS NULL",[c.user_id]);
    const approved=decision.decision==="verified";
    await enqueueNotice(db,c.user_id,approved?"verification_approved":"verification_declined",
      approved?"Your age is verified":"Age verification not approved",
      approved?"Your account is verified. You can now host and join drinks.":"Your submission could not be verified. Check your profile for details.",
      "/verification");
    for(const file of [c.id_file_key,c.selfie_file_key]){
      if(file)await db.query("INSERT INTO verification_photo_deletions(file_key) VALUES($1) ON CONFLICT DO NOTHING",[file]);
    }
    await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK");throw e;}finally{db.release();}
  await drainPhotoDeletionQueue();
  return {status:decision.decision,final:true};
}
/** Persisted deletion jobs are retried after service restart. */
export async function drainPhotoDeletionQueue(){
  if(process.env.VERIFICATION_UPLOADS_ENABLED!=="true")return 0;
  const r=await pool.query<{file_key:string}>(`SELECT file_key FROM verification_photo_deletions
    WHERE deleted_at IS NULL ORDER BY created_at ASC LIMIT 300`);
  let done=0;
  for(const row of r.rows){
    try{
      await removePhoto(row.file_key);
      await pool.query("UPDATE verification_photo_deletions SET deleted_at=NOW(),last_error=NULL WHERE file_key=$1",
        [row.file_key]);
      done++;
    }catch(e){
      await pool.query("UPDATE verification_photo_deletions SET attempts=attempts+1,last_error=$2 WHERE file_key=$1",
        [row.file_key,e instanceof Error?e.message.slice(0,240):"Deletion failed"]);
    }
  }
  return done;
}
/** Expire all pending/draft images at 24 hours and queue secure deletion atomically. */
export async function purgeExpiredVerificationPhotos(){
  if(process.env.VERIFICATION_UPLOADS_ENABLED!=="true")return 0;
  const db=await pool.connect();let expired=0;
  try{
    await db.query("BEGIN");
    const cases=await db.query<ReviewCase>(`SELECT * FROM age_verification_cases
      WHERE status IN ('draft','pending') AND expires_at<=NOW()
      ORDER BY expires_at ASC FOR UPDATE SKIP LOCKED LIMIT 300`);
    for(const c of cases.rows){
      await db.query(`UPDATE age_verification_cases
        SET status='expired',id_file_key=NULL,selfie_file_key=NULL WHERE id=$1`,[c.id]);
      for(const key of [c.id_file_key,c.selfie_file_key]){
        if(key)await db.query("INSERT INTO verification_photo_deletions(file_key) VALUES($1) ON CONFLICT DO NOTHING",[key]);
      }
      await enqueueNotice(db,c.user_id,"verification_expired","Age review expired",
        "Your review period ended. You can send new photos for another review.","/verification");
      expired++;
    }
    await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK");throw e;}finally{db.release();}
  await drainPhotoDeletionQueue();
  return expired;
}
