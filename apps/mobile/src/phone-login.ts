import * as SecureStore from "expo-secure-store";

const accessKey="tokea_access_token",refreshKey="tokea_refresh_token",userKey="tokea_account_id";
export type PhoneLoginSession={accessToken:string;refreshToken:string;expiresInSeconds:number;userId:string;ageVerified:boolean;displayName:string};
export function normalizeKenyanPhone(input:string){
  const raw=input.replace(/[\s()-]/g,"");
  if(/^0[71]\d{8}$/.test(raw))return "+254"+raw.slice(1);
  if(/^254[71]\d{8}$/.test(raw))return "+"+raw;
  if(/^\+254[71]\d{8}$/.test(raw))return raw;
  throw Error("Enter a Kenyan phone number starting with 07 or 01.");
}
export function localApiUrl(){
  const base=process.env.EXPO_PUBLIC_API_URL;
  const loopback=!!base&&/^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2):\d{2,5}$/.test(base);
  if(!base||!(base.startsWith("https://")||(__DEV__&&process.env.EXPO_PUBLIC_ALLOW_LOOPBACK_HTTP==="true"&&loopback)))
    throw Error("Tokea isn't connected yet. Please check the app setup.");
  return base;
}
async function authCall(path:string,payload:object){
  const res=await fetch(localApiUrl()+path,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),
  });
  const body=await res.json() as {error?:string;[key:string]:unknown};
  if(!res.ok)throw Error(body.error??"Something went wrong. Please try again.");
  return body;
}
export async function requestLoginCode(phone:string){
  return authCall("/v1/auth/request-code",{phone:normalizeKenyanPhone(phone)});
}
export async function completeLogin(phone:string,code:string){
  const result=await authCall("/v1/auth/verify-code",{phone:normalizeKenyanPhone(phone),code}) as PhoneLoginSession;
  await SecureStore.setItemAsync(accessKey,result.accessToken);
  await SecureStore.setItemAsync(refreshKey,result.refreshToken);
  await SecureStore.setItemAsync(userKey,result.userId);
  return result;
}
export async function refreshAccessToken(){
  const secret=await SecureStore.getItemAsync(refreshKey);
  if(!secret)return null;
  try{
    const session=await authCall("/v1/auth/refresh",{refreshToken:secret}) as
      {accessToken:string;refreshToken:string};
    await SecureStore.setItemAsync(accessKey,session.accessToken);
    await SecureStore.setItemAsync(refreshKey,session.refreshToken);
    return session.accessToken;
  }catch{
    // An expired or revoked refresh session must not make further authenticated requests.
    await SecureStore.deleteItemAsync(accessKey);
    await SecureStore.deleteItemAsync(refreshKey);
    await SecureStore.deleteItemAsync(userKey);
    return null;
  }
}
export function currentUserId(){return SecureStore.getItemAsync(userKey);}
export async function signOut(){
  const secret=await SecureStore.getItemAsync(refreshKey);
  // Always clear local access, even without connectivity.
  await SecureStore.deleteItemAsync(accessKey);
  await SecureStore.deleteItemAsync(refreshKey);
  await SecureStore.deleteItemAsync(userKey);
  if(secret)await authCall("/v1/auth/sign-out",{refreshToken:secret}).catch(()=>{});
}
