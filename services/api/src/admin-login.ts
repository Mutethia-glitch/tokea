import { createRemoteJWKSet, jwtVerify } from "jose";
import { ApiError } from "./auth.js";
import { issueLocalAccessToken } from "./local-identity.js";
import { pool } from "./db.js";
import { z } from "zod";

export const exchangeSchema=z.object({
  code:z.string().min(8).max(4000),
  verifier:z.string().min(43).max(128).regex(/^[A-Za-z0-9_-]+$/),
  nonce:z.string().min(20).max(120),
}).strict();
function settings(){
  const clientId=process.env.ADMIN_OIDC_CLIENT_ID;
  const clientSecret=process.env.ADMIN_OIDC_CLIENT_SECRET;
  const redirectUri=process.env.ADMIN_OIDC_REDIRECT_URI??"http://127.0.0.1:4400/admin";
  const parsed=new URL(redirectUri);
  if(!clientId||!clientSecret||parsed.protocol!=="http:"||
     !["127.0.0.1","localhost"].includes(parsed.hostname)||parsed.pathname!=="/admin")
    throw new ApiError(503,"Staff Google sign-in is not yet configured.");
  return {clientId,clientSecret,redirectUri,
    authorizeUrl:"https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl:"https://oauth2.googleapis.com/token"};
}
export function loginConfig(){
  const cfg=settings();
  return {authorizeUrl:cfg.authorizeUrl,clientId:cfg.clientId,
    redirectUri:cfg.redirectUri,scope:"openid email profile"};
}
const googleJWKS=createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

/** Google authorization-code + PKCE, then verify the ID TOKEN, not the OAuth access token. */
export async function exchangeCode(code:string,verifier:string,nonce:string){
  const cfg=settings();
  const body=new URLSearchParams({
    grant_type:"authorization_code",client_id:cfg.clientId,client_secret:cfg.clientSecret,
    code,code_verifier:verifier,redirect_uri:cfg.redirectUri,
  });
  let response:Response;
  try{
    response=await fetch(cfg.tokenUrl,{method:"POST",headers:{
      "content-type":"application/x-www-form-urlencoded"},body,
      signal:AbortSignal.timeout(10_000)});
  }catch{throw new ApiError(502,"Could not reach Google. Try signing in again.");}
  if(!response.ok)throw new ApiError(401,"Google sign-in expired. Please try again.");
  const tokens=await response.json() as {id_token?:string};
  if(!tokens.id_token)throw new ApiError(401,"Google did not verify your identity.");
  let subject:string,email:string;
  try{
    const {payload}=await jwtVerify(tokens.id_token,googleJWKS,{
      issuer:["https://accounts.google.com","accounts.google.com"],
      audience:cfg.clientId,algorithms:["RS256"],
    });
    if(payload.nonce!==nonce||payload.email_verified!==true||
       typeof payload.email!=="string"||typeof payload.sub!=="string")
      throw Error("Missing verified Google claims");
    email=payload.email.toLowerCase();subject=payload.sub;
  }catch{throw new ApiError(401,"Google identity could not be verified. Sign in again.");}

  const db=await pool.connect();
  let userId:string;
  try{
    await db.query("BEGIN");
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",[email]);
    const r=await db.query<{user_id:string;google_subject:string|null}>(
      "SELECT user_id,google_subject FROM staff_google_identities WHERE email=$1 FOR UPDATE",[email]);
    if(r.rows[0]){
      if(r.rows[0].google_subject&&r.rows[0].google_subject!==subject)
        throw new ApiError(403,"This email is linked to another Google identity.");
      userId=r.rows[0].user_id;
      await db.query("UPDATE staff_google_identities SET google_subject=$2 WHERE email=$1 AND google_subject IS NULL",
        [email,subject]);
    }else{
      // New verified Google identities have NO admin privileges until they accept an invite.
      const user=await db.query<{id:string}>(
        "INSERT INTO users(display_name) VALUES($1) RETURNING id",[email.split("@")[0]!]);
      userId=user.rows[0]!.id;
      await db.query("INSERT INTO staff_google_identities(email,user_id,google_subject) VALUES($1,$2,$3)",
        [email,userId,subject]);
    }
    await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK");throw e;}finally{db.release();}
  return {accessToken:await issueLocalAccessToken(userId!,{email,emailVerified:true})};
}
