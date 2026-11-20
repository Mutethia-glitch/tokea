import { createPrivateKey, createPublicKey, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SignJWT, jwtVerify } from "jose";
import { ApiError } from "./auth.js";

const issuer="urn:tokea:verified-phone";
const audience="tokea-api";
let key:KeyObject|undefined;
function privateKey(){
  if(process.env.OTP_AUTH_ENABLED!=="true")throw new ApiError(503,"Phone sign-in is not configured.");
  if(!key){
    const path=process.env.AUTH_PRIVATE_KEY_FILE;
    if(!path)throw new ApiError(503,"Local signing key not configured.");
    try {key=createPrivateKey(readFileSync(resolve(path),"utf8"));}
    catch{throw new ApiError(503,"Local signing key could not be loaded.");}
    if(key.asymmetricKeyType!=="rsa")throw new ApiError(503,"Expected an RSA signing key.");
  }
  return key;
}
export async function issueLocalAccessToken(
  id:string,claims:{email?:string;emailVerified?:boolean}={}
) {
  const jwt=new SignJWT({
    ...(claims.email?{email:claims.email,email_verified:claims.emailVerified===true}:{}),
  }).setProtectedHeader({alg:"RS256",typ:"JWT"})
    .setSubject(id).setIssuer(issuer).setAudience(audience)
    .setIssuedAt().setExpirationTime("1h");
  return jwt.sign(privateKey());
}
export async function verifyLocalAccessToken(token:string){
  const publicKey=createPublicKey(privateKey());
  const {payload}=await jwtVerify(token,publicKey,{
    issuer,audience,algorithms:["RS256"],clockTolerance:5,
  });
  return payload;
}
