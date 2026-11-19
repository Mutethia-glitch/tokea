import { File } from "expo-file-system";
import * as SecureStore from "expo-secure-store";

export type VerificationStatus={
  verified:boolean;
  status:"not_submitted"|"draft"|"pending"|"verified"|"declined"|"expired";
  submittedAt:string|null;expiresAt:string|null;
  reason:string|null;canUpload:boolean;reviewTarget:string;
};
const API=()=>process.env.EXPO_PUBLIC_API_URL;
function baseUrl(){
  const base=API();
  const local=!!base&&/^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2):\d{2,5}$/.test(base);
  if(!base||!(base.startsWith("https://")||(__DEV__&&process.env.EXPO_PUBLIC_ALLOW_LOOPBACK_HTTP==="true"&&local)))
    throw Error("A secure API URL or authorized local emulator connection is required.");
  return base;
}
async function signedHeaders(){
  const token=await SecureStore.getItemAsync("tokea_access_token");
  if(!token)throw Error("Sign in to Tokea before verifying your age.");
  return {Authorization:`Bearer ${token}`};
}
async function request(path:string,method="GET",body?:BodyInit,contentType?:string){
  const authorization=await signedHeaders();
  const response=await fetch(baseUrl()+path,{
    method,headers:{...authorization,...(contentType?{"Content-Type":contentType}:{})},
    ...(body?{body}:{})
  });
  let result:any;
  try{result=await response.json();}catch{result={};}
  if(!response.ok)throw Error(typeof result.error==="string"?result.error:`Upload failed (${response.status})`);
  return result;
}
export async function getVerificationStatus():Promise<VerificationStatus>{
  return request("/v1/verification/status");
}
/** The file stays on this device until upload completes. Do not store it in AsyncStorage. */
export async function uploadIdentityPhoto(uri:string,kind:"id"|"selfie",mimeType:string){
  const photo=new File(uri);
  if(photo.size>5*1024*1024)throw Error("Photo must be no more than 5 MB.");
  const payload=await photo.arrayBuffer();
  return request(`/v1/verification/photos/${kind}`,"POST",payload,
    ["image/jpeg","image/png","image/webp"].includes(mimeType)?mimeType:"image/jpeg");
}
export async function submitAgeReview(consent:boolean){
  if(!consent)throw Error("Please read the privacy notice and consent to the temporary ID and selfie review.");
  return request("/v1/verification/submit","POST",JSON.stringify({consent:true}),"application/json") as
    Promise<{status:"pending";message:string}>;
}
