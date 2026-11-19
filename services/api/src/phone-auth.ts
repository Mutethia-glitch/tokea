import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { pool } from "./db.js";
import { ApiError } from "./auth.js";
import { issueLocalAccessToken } from "./local-identity.js";
import { sendKenyaOtp } from "./kenya-sms.js";

export const kenyaPhoneSchema=z.string().trim().regex(/^\+254(?:7\d{8}|1\d{8})$/,
  "Enter a Kenyan mobile number, e.g. +254712345678.");
export const requestCodeSchema=z.object({phone:kenyaPhoneSchema}).strict();
export const verifyCodeSchema=z.object({
  phone:kenyaPhoneSchema,code:z.string().regex(/^\d{6}$/),
}).strict();
export const refreshSchema=z.object({refreshToken:z.string().min(42).max(128)}).strict();

function hmac(value:string) {
  const pepper=process.env.OTP_HMAC_SECRET;
  if(process.env.OTP_AUTH_ENABLED!=="true"||!pepper||pepper.length<32)
    throw new ApiError(503,"SMS sign-in is not ready yet.");
  return createHmac("sha256",pepper).update(value).digest("hex");
}
export function hashOtp(phone:string,code:string){return hmac(phone+"|"+code);}
const hashSession=(token:string)=>hmac("refresh|"+token);
const refreshLifetime=30*24*60*60*1000;

export async function requestPhoneCode(phone:string,sourceAddress="local"){
  // Fail closed until SMS and keys are actually configured.
  if(!process.env.AT_USERNAME||!process.env.AT_API_KEY||!process.env.AT_MODE)
    throw new ApiError(503,"SMS provider setup is not complete.");
  const code=String(randomInt(0,1_000_000)).padStart(6,"0");
  const hash=hashOtp(phone,code);
  const db=await pool.connect();
  try{
    await db.query("BEGIN");
    // Limit abusive SMS bursts from one connection as well as from one number.
    const originHash=hmac("source|"+sourceAddress);
    const origin=await db.query<{count:number;window_started_at:Date}>(
      "SELECT count,window_started_at FROM phone_otp_origin_limits WHERE origin_hash=$1 FOR UPDATE",
      [originHash]);
    const within=!!origin.rows[0]&&Date.now()-origin.rows[0].window_started_at.getTime()<3_600_000;
    if(within&&origin.rows[0]!.count>=15)
      throw new ApiError(429,"Too many sign-in attempts. Please try again later.");
    await db.query(`INSERT INTO phone_otp_origin_limits(origin_hash,window_started_at,count)
      VALUES($1,NOW(),1) ON CONFLICT(origin_hash) DO UPDATE
      SET window_started_at=CASE WHEN $2 THEN phone_otp_origin_limits.window_started_at ELSE NOW() END,
          count=CASE WHEN $2 THEN phone_otp_origin_limits.count+1 ELSE 1 END`,[originHash,within]);
    const existing=await db.query<{requested_at:Date;hourly_window:Date;hourly_count:number}>(
      "SELECT requested_at,hourly_window,hourly_count FROM phone_login_codes WHERE phone_e164=$1 FOR UPDATE",[phone]);
    const previous=existing.rows[0],now=Date.now();
    if(previous&&now-previous.requested_at.getTime()<60_000)
      throw new ApiError(429,"Please wait a minute before requesting another code.");
    const hourly=!!previous&&now-previous.hourly_window.getTime()<3_600_000;
    if(hourly&&previous.hourly_count>=5)
      throw new ApiError(429,"Too many codes requested. Please try again later.");
    // Store challenge first, roll back if Africa's Talking rejects the SMS.
    await db.query(`INSERT INTO phone_login_codes
      (phone_e164,code_hmac,expires_at,attempts,requested_at,hourly_window,hourly_count)
      VALUES($1,$2,NOW()+INTERVAL '5 minutes',0,NOW(),NOW(),1)
      ON CONFLICT(phone_e164) DO UPDATE SET code_hmac=EXCLUDED.code_hmac,
      expires_at=EXCLUDED.expires_at,attempts=0,requested_at=NOW(),
      hourly_window=CASE WHEN $3 THEN phone_login_codes.hourly_window ELSE NOW() END,
      hourly_count=CASE WHEN $3 THEN phone_login_codes.hourly_count+1 ELSE 1 END`,
      [phone,hash,hourly]);
    await sendKenyaOtp(phone,code);
    await db.query("COMMIT");
    return {sent:true,message:"Check your messages. Your six-digit code expires in 5 minutes."};
  }catch(e){await db.query("ROLLBACK");throw e;}finally{db.release();}
}
async function issueSession(db:Awaited<ReturnType<typeof pool.connect>>,id:string){
  const accessToken=await issueLocalAccessToken(id);
  const refreshToken=randomBytes(48).toString("base64url");
  await db.query("INSERT INTO phone_refresh_sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)",
    [hashSession(refreshToken),id,new Date(Date.now()+refreshLifetime)]);
  return {accessToken,refreshToken,expiresInSeconds:3600};
}
export async function verifyPhoneCode(phone:string,code:string){
  const db=await pool.connect();
  try{
    await db.query("BEGIN");
    const challenge=await db.query<{code_hmac:string;expires_at:Date;attempts:number}>(
      "SELECT code_hmac,expires_at,attempts FROM phone_login_codes WHERE phone_e164=$1 FOR UPDATE",[phone]);
    const row=challenge.rows[0];
    if(!row||row.expires_at.getTime()<=Date.now()||row.attempts>=5)
      throw new ApiError(401,"Code expired. Request a new one.");
    const left=Buffer.from(row.code_hmac,"hex"),right=Buffer.from(hashOtp(phone,code),"hex");
    if(left.length!==right.length||!timingSafeEqual(left,right)){
      await db.query("UPDATE phone_login_codes SET attempts=attempts+1 WHERE phone_e164=$1",[phone]);
      await db.query("COMMIT");
      throw new ApiError(401,"That code isn't correct. Please try again.");
    }
    await db.query("DELETE FROM phone_login_codes WHERE phone_e164=$1",[phone]);
    const account=await db.query<{id:string;display_name:string;age_verified_at:Date|null}>(`INSERT INTO users(phone_e164,display_name)
      VALUES($1,'New member') ON CONFLICT(phone_e164) DO UPDATE
      SET phone_e164=EXCLUDED.phone_e164 RETURNING id,display_name,age_verified_at`,[phone]);
    const session=await issueSession(db,account.rows[0]!.id);
    await db.query("COMMIT");
    return {...session,userId:account.rows[0]!.id,displayName:account.rows[0]!.display_name,
      ageVerified:!!account.rows[0]!.age_verified_at};
  }catch(e){
    await db.query("ROLLBACK").catch(()=>{});
    throw e;
  }finally{db.release();}
}
export async function refreshPhoneSession(token:string){
  const db=await pool.connect();
  try{
    await db.query("BEGIN");
    const hash=hashSession(token);
    const r=await db.query<{user_id:string;expires_at:Date;is_active:boolean}>(`SELECT s.user_id,s.expires_at,u.is_active
      FROM phone_refresh_sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=$1 FOR UPDATE`,[hash]);
    if(!r.rows[0]?.is_active||r.rows[0].expires_at.getTime()<=Date.now())
      throw new ApiError(401,"Session expired. Please sign in again.");
    await db.query("DELETE FROM phone_refresh_sessions WHERE token_hash=$1",[hash]);
    const updated=await issueSession(db,r.rows[0].user_id);
    await db.query("COMMIT");
    return updated;
  }catch(e){await db.query("ROLLBACK");throw e;}finally{db.release();}
}
export async function revokePhoneSession(token:string){
  await pool.query("DELETE FROM phone_refresh_sessions WHERE token_hash=$1",[hashSession(token)]);
  return {signedOut:true};
}
