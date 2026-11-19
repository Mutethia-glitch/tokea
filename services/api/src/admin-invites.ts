import { createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { pool } from "./db.js";
import { ApiError, requireAdmin, type AuthenticatedUser } from "./auth.js";
import { z } from "zod";

export const invitationSchema=z.object({
  email:z.email().trim().transform(x=>x.toLowerCase()),
}).strict();
const acceptSchema=z.object({token:z.string().min(40).max(150)}).strict();
export {acceptSchema};
function smtpSettings() {
  const host=process.env.SMTP_HOST,port=Number(process.env.SMTP_PORT??"587");
  const username=process.env.SMTP_USER,password=process.env.SMTP_PASSWORD;
  const sender=process.env.ADMIN_INVITES_FROM,link=process.env.ADMIN_PANEL_URL;
  if(!host||!username||!password||!sender||!link||
    !(link.startsWith("https://")||/^http:\/\/127\.0\.0\.1(:\d+)?\/admin/.test(link)))
    throw new ApiError(503,"Admin invitation email provider and panel URL are not configured.");
  return {host,port,username,password,sender,link};
}
export async function sendAdminInvite(actor:AuthenticatedUser,email:string) {
  await requireAdmin(actor,true);
  const smtp=smtpSettings();
  const existing=await pool.query<{total:string}>(`SELECT COUNT(*)::text AS total FROM admin_invitations
    WHERE invited_by=$1 AND created_at>NOW()-INTERVAL '1 hour'`,[actor.id]);
  if(Number(existing.rows[0]?.total??0)>=5)throw new ApiError(429,"Admin invitation limit reached. Try again later.");
  const token=randomBytes(32).toString("base64url");
  const hash=createHash("sha256").update(token).digest("hex");
  const saved=await pool.query<{id:string}>(
    "INSERT INTO admin_invitations(email,token_hash,invited_by) VALUES($1,$2,$3) RETURNING id",
    [email.toLowerCase(),hash,actor.id]);
  const id=saved.rows[0]!.id;
  const url=smtp.link.replace(/\/$/,"") + "#invite=" + encodeURIComponent(token);
  try {
    const mailer=nodemailer.createTransport({
      host:smtp.host,port:smtp.port,secure:smtp.port===465,
      auth:{user:smtp.username,pass:smtp.password},
      tls:{rejectUnauthorized:true},
    });
    await mailer.sendMail({
      from:smtp.sender,to:email,subject:"Tokea — invitation to review age verifications",
      text:`You have been invited to join the Tokea verification team.\nOpen this invitation on the authorized admin workspace: ${url}\nSign in with this email using the configured identity provider before accepting.\nInvitation expires in 48 hours. Do not forward this link.`,
    });
  }catch{
    await pool.query("UPDATE admin_invitations SET expires_at=NOW() WHERE id=$1",[id]);
    throw new ApiError(502,"Could not send the admin invitation. Check SMTP settings.");
  }
  return {sent:true,email,expiresInHours:48};
}
export async function acceptAdminInvite(actor:AuthenticatedUser,token:string) {
  if(!actor.emailVerified||!actor.email)throw new ApiError(403,"Sign in with a verified email address to accept an admin invitation.");
  const hash=createHash("sha256").update(token).digest("hex");
  const db=await pool.connect();
  try{
    await db.query("BEGIN");
    const r=await db.query<{id:string;email:string;role:string;expires_at:Date;accepted_at:Date|null}>(
      "SELECT * FROM admin_invitations WHERE token_hash=$1 FOR UPDATE",[hash]);
    const row=r.rows[0];
    if(!row||row.accepted_at||row.expires_at.getTime()<Date.now()||row.email!==actor.email)
      throw new ApiError(403,"Invitation invalid, expired, already used or addressed to another email.");
    await db.query(`INSERT INTO admin_memberships(user_id,role) VALUES($1,'reviewer')
      ON CONFLICT(user_id) DO NOTHING`,[actor.id]);
    await db.query("UPDATE admin_invitations SET accepted_at=NOW() WHERE id=$1",[row.id]);
    await db.query("COMMIT");
    return {accepted:true,role:"reviewer"};
  }catch(e){await db.query("ROLLBACK");throw e;}finally{db.release();}
}

/** Remove consumed and expired invitation secrets; accepted staff memberships remain. */
export async function purgeFinishedInvitations(){
  const result=await pool.query(
    "DELETE FROM admin_invitations WHERE accepted_at IS NOT NULL OR expires_at<=NOW()");
  return result.rowCount??0;
}
