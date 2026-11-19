import { ApiError } from "./auth.js";
import { z } from "zod";

export const exchangeSchema=z.object({
  code:z.string().min(8).max(4000),
  verifier:z.string().min(43).max(128).regex(/^[A-Za-z0-9_-]+$/),
}).strict();
function settings(){
  const authorizeUrl=process.env.ADMIN_OIDC_AUTHORIZE_URL;
  const tokenUrl=process.env.ADMIN_OIDC_TOKEN_URL;
  const clientId=process.env.ADMIN_OIDC_CLIENT_ID;
  const uri=process.env.ADMIN_OIDC_REDIRECT_URI;
  if(!authorizeUrl||!tokenUrl||!clientId||!uri)
    throw new ApiError(503,"Staff sign-in is not available yet.");
  const authorize=new URL(authorizeUrl),token=new URL(tokenUrl),redirect=new URL(uri);
  if(authorize.protocol!=="https:"||token.protocol!=="https:"||
     redirect.hostname!=="127.0.0.1"||redirect.pathname!=="/admin"||
     redirect.protocol!=="http:")
    throw new ApiError(503,"Staff sign-in settings are not valid for local development.");
  return {authorizeUrl,tokenUrl,clientId,redirectUri:uri};
}
export function loginConfig(){
  const cfg=settings();
  return {authorizeUrl:cfg.authorizeUrl,clientId:cfg.clientId,redirectUri:cfg.redirectUri,scope:"openid email"};
}
/** OIDC authorization-code + PKCE. No staff passwords or tokens are persisted in a browser. */
export async function exchangeCode(code:string,verifier:string){
  const cfg=settings();
  const body=new URLSearchParams({
    grant_type:"authorization_code",client_id:cfg.clientId,
    code,code_verifier:verifier,redirect_uri:cfg.redirectUri,
  });
  let response:Response;
  try{
    response=await fetch(cfg.tokenUrl,{
      method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},
      body,signal:AbortSignal.timeout(10_000),
    });
  }catch{throw new ApiError(502,"Unable to complete sign-in. Please try again.");}
  if(!response.ok)throw new ApiError(401,"Sign-in session expired. Please sign in again.");
  const result=await response.json() as {access_token?:unknown};
  if(typeof result.access_token!=="string"||result.access_token.length>10000)
    throw new ApiError(502,"Sign-in did not return a valid session.");
  return {accessToken:result.access_token};
}
