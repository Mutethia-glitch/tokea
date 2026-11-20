import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { authenticateIdentity, requireVerifiedAdult, requireAdmin, ApiError } from "./auth.js";
import { loginConfig, exchangeCode, exchangeSchema } from "./admin-login.js";
import { getMyProfile,updateMyName,saveMyAvatar,readUserAvatar,removeMyAvatar } from "./profile-photos.js";
import { requestCodeSchema,verifyCodeSchema,refreshSchema,
  requestPhoneCode,verifyPhoneCode,refreshPhoneSession,revokePhoneSession } from "./phone-auth.js";
import { decideJoinRequest } from "./decisions.js";
import { getInbox, markInboxRead } from "./inbox.js";
import { registerDevice, unregisterDevice } from "./devices.js";
import { createSession, createSessionSchema, discoverSchema, discoverSessions, getSession } from "./sessions.js";
import { cancelRequest, listRequests, requestSchema, requestToJoin } from "./requests.js";
import { getMessages, messageSchema, sendMessage } from "./messages.js";
import { decideVerification, decisionSchema as reviewSchema, getVerificationStatus, listReviewQueue,
  submitVerification, uploadDocument, viewReviewPhoto } from "./verification.js";
import { acceptAdminInvite, acceptSchema, invitationSchema, sendAdminInvite } from "./admin-invites.js";

const decisionSchema=z.object({decision:z.enum(["accepted","declined"])}).strict();
const tokenSchema=z.object({token:z.string().min(1).max(255),platform:z.enum(["ios","android"])}).strict();
const uuid="([0-9a-fA-F-]{36})";
const normalHeaders={"cache-control":"no-store","x-content-type-options":"nosniff"};
function respond(res:ServerResponse,status:number,body:unknown){
  res.writeHead(status,{"content-type":"application/json; charset=utf-8",...normalHeaders});
  res.end(JSON.stringify(body));
}
async function readBody(req:IncomingMessage,limit:number){
  const chunks:Buffer[]=[];let size=0;
  for await(const chunk of req){
    const b=Buffer.from(chunk);size+=b.length;
    if(size>limit)throw new ApiError(413,"Upload exceeds allowed size.");
    chunks.push(b);
  }
  return Buffer.concat(chunks);
}
async function parseBody(req:IncomingMessage){
  if(req.headers["content-type"]?.split(";")[0]!=="application/json")
    throw new ApiError(415,"JSON request body required.");
  try{return JSON.parse((await readBody(req,16_384)).toString("utf8"));}
  catch(e){if(e instanceof ApiError)throw e;throw new ApiError(400,"Invalid JSON.");}
}
async function adminAsset(res:ServerResponse,asset:string){
  // Local staff-only frontend. No credentials are embedded or persisted in this page.
  if(!["index.html","admin.js","admin.css"].includes(asset))
    throw new ApiError(404,"Not found.");
  const content=await readFile(join(process.cwd(),"admin",asset));
  res.writeHead(200,{
    ...normalHeaders,
    "content-type":asset.endsWith(".html")?"text/html; charset=utf-8":
      asset.endsWith(".js")?"text/javascript; charset=utf-8":"text/css; charset=utf-8",
    "content-security-policy":"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    "referrer-policy":"no-referrer",
    "x-frame-options":"DENY",
  });res.end(content);
}
export async function route(req:IncomingMessage,res:ServerResponse){
  try{
    const method=req.method??"GET";
    const url=new URL(req.url??"/","http://localhost");
    const path=url.pathname;
    if(method==="GET"&&path==="/healthz")
      return respond(res,200,{ok:true,service:"tokea-api"});
    if(method==="POST"&&path==="/v1/auth/request-code"){
      const input=requestCodeSchema.parse(await parseBody(req));
      return respond(res,200,await requestPhoneCode(input.phone,req.socket.remoteAddress??"unknown"));
    }
    if(method==="POST"&&path==="/v1/auth/verify-code"){
      const input=verifyCodeSchema.parse(await parseBody(req));
      return respond(res,200,await verifyPhoneCode(input.phone,input.code));
    }
    if(method==="POST"&&path==="/v1/auth/refresh"){
      const input=refreshSchema.parse(await parseBody(req));
      return respond(res,200,await refreshPhoneSession(input.refreshToken));
    }
    if(method==="POST"&&path==="/v1/auth/sign-out"){
      const input=refreshSchema.parse(await parseBody(req));
      return respond(res,200,await revokePhoneSession(input.refreshToken));
    }
    if(method==="GET"&&path==="/admin")
      return await adminAsset(res,"index.html");
    if(method==="GET"&&path==="/admin/admin.js")
      return await adminAsset(res,"admin.js");
    if(method==="GET"&&path==="/admin/admin.css")
      return await adminAsset(res,"admin.css");
    if(method==="GET"&&path==="/v1/admin/auth/config")
      return respond(res,200,loginConfig());
    if(method==="POST"&&path==="/v1/admin/auth/exchange"){
      const payload=exchangeSchema.parse(await parseBody(req));
      return respond(res,200,await exchangeCode(payload.code,payload.verifier,payload.nonce));
    }
    const user=await authenticateIdentity(req.headers);
    if(method==="GET"&&path==="/v1/me")
      return respond(res,200,await getMyProfile(user.id));
    if(method==="PATCH"&&path==="/v1/me"){
      const update=z.object({displayName:z.string().trim().min(2).max(60)}).strict().parse(await parseBody(req));
      return respond(res,200,await updateMyName(user.id,update.displayName));
    }
    if(method==="POST"&&path==="/v1/me/photo"){
      if(!["image/jpeg","image/png","image/webp"].includes(req.headers["content-type"]?.split(";")[0]??""))
        throw new ApiError(415,"Use a JPG, PNG or WebP picture.");
      return respond(res,200,await saveMyAvatar(user.id,await readBody(req,5*1024*1024)));
    }
    if(method==="DELETE"&&path==="/v1/me/photo")
      return respond(res,200,await removeMyAvatar(user.id));
    const avatarPath=new RegExp("^/v1/users/"+uuid+"/photo$").exec(path);
    if(method==="GET"&&avatarPath){
      const file=await readUserAvatar(avatarPath[1]!);
      res.writeHead(200,{...normalHeaders,"content-type":"image/jpeg","content-security-policy":"default-src 'none'","cross-origin-resource-policy":"same-origin"});
      res.end(file);return;
    }
    if(method==="GET"&&path==="/v1/admin/me")
      return respond(res,200,{role:await requireAdmin(user)});

    if(method==="GET"&&path==="/v1/verification/status")
      return respond(res,200,await getVerificationStatus(user.id));
    const photoPath=/^\/v1\/verification\/photos\/(id|selfie)$/.exec(path);
    if(method==="POST"&&photoPath){
      const ct=req.headers["content-type"]?.split(";")[0];
      if(!["image/jpeg","image/png","image/webp"].includes(ct??""))
        throw new ApiError(415,"Upload a JPG, PNG or WebP image.");
      const bytes=await readBody(req,5*1024*1024);
      return respond(res,201,await uploadDocument(user,photoPath[1] as "id"|"selfie",bytes,
        req.headers["x-tokea-privacy-consent"]==="true"));
    }
    if(method==="POST"&&path==="/v1/verification/submit"){
      const consent=z.object({consent:z.literal(true)}).strict().parse(await parseBody(req));
      if(!consent.consent)throw new ApiError(400,"Please accept the privacy notice.");
      return respond(res,200,await submitVerification(user));
    }

    if(method==="GET"&&path==="/v1/admin/verifications")
      return respond(res,200,{submissions:await listReviewQueue(user)});
    const adminPhoto=new RegExp("^/v1/admin/verifications/"+uuid+"/photos/(id|selfie)$").exec(path);
    if(method==="GET"&&adminPhoto){
      const data=await viewReviewPhoto(user,adminPhoto[1]!,adminPhoto[2] as "id"|"selfie");
      res.writeHead(200,{...normalHeaders,"content-type":"image/jpeg",
        "content-disposition":"inline","referrer-policy":"no-referrer",
        "content-security-policy":"default-src 'none'; sandbox","x-frame-options":"DENY"});
      res.end(data);return;
    }
    const adminDecision=new RegExp("^/v1/admin/verifications/"+uuid+"/decision$").exec(path);
    if(method==="POST"&&adminDecision)
      return respond(res,200,await decideVerification(user,adminDecision[1]!,
        reviewSchema.parse(await parseBody(req))));
    if(method==="POST"&&path==="/v1/admin/invitations"){
      const input=invitationSchema.parse(await parseBody(req));
      return respond(res,201,await sendAdminInvite(user,input.email));
    }
    if(method==="POST"&&path==="/v1/admin/invitations/accept"){
      const input=acceptSchema.parse(await parseBody(req));
      return respond(res,200,await acceptAdminInvite(user,input.token));
    }

    // Browsing, account status and notifications are available before age review.
    if(method==="GET"&&path==="/v1/sessions"){
      const filters=discoverSchema.parse(Object.fromEntries(url.searchParams));
      return respond(res,200,{sessions:await discoverSessions(user.id,filters)});
    }
    const sessionPath=new RegExp("^/v1/sessions/"+uuid+"$").exec(path);
    if(method==="GET"&&sessionPath)
      return respond(res,200,{session:await getSession(user.id,sessionPath[1]!)});
    if(method==="GET"&&path==="/v1/notifications")
      return respond(res,200,{notifications:await getInbox(user.id)});
    const markPath=new RegExp("^/v1/notifications/"+uuid+"/read$").exec(path);
    if(method==="PATCH"&&markPath)
      return respond(res,200,await markInboxRead(user.id,markPath[1]!));
    if(method==="POST"&&path==="/v1/devices"){
      const input=tokenSchema.parse(await parseBody(req));
      return respond(res,201,await registerDevice(user.id,input.token,input.platform));
    }
    const devicePath=new RegExp("^/v1/devices/"+uuid+"$").exec(path);
    if(method==="DELETE"&&devicePath)
      return respond(res,200,await unregisterDevice(user.id,devicePath[1]!));

    // All hosting, joining, deciding and messaging are server-side age gated.
    requireVerifiedAdult(user);
    if(method==="POST"&&path==="/v1/sessions"){
      const input=createSessionSchema.parse(await parseBody(req));
      return respond(res,201,await createSession(user.id,input));
    }
    if(method==="GET"&&path==="/v1/requests")
      return respond(res,200,await listRequests(user.id));
    const joinPath=new RegExp("^/v1/sessions/"+uuid+"/requests$").exec(path);
    if(method==="POST"&&joinPath){
      const input=requestSchema.parse(await parseBody(req));
      return respond(res,201,await requestToJoin(user.id,joinPath[1]!,input));
    }
    const cancelPath=new RegExp("^/v1/requests/"+uuid+"/cancel$").exec(path);
    if(method==="PATCH"&&cancelPath)
      return respond(res,200,await cancelRequest(user.id,cancelPath[1]!));
    const chatPath=new RegExp("^/v1/sessions/"+uuid+"/messages$").exec(path);
    if(method==="GET"&&chatPath)
      return respond(res,200,{messages:await getMessages(user.id,chatPath[1]!)});
    if(method==="POST"&&chatPath){
      const input=messageSchema.parse(await parseBody(req));
      return respond(res,201,{message:await sendMessage(user.id,chatPath[1]!,input.text)});
    }
    const decisionPath=new RegExp("^/v1/sessions/"+uuid+"/requests/"+uuid+"/decision$").exec(path);
    if(method==="POST"&&decisionPath){
      const input=decisionSchema.parse(await parseBody(req));
      return respond(res,200,await decideJoinRequest(user.id,decisionPath[1]!,decisionPath[2]!,input.decision));
    }
    throw new ApiError(404,"Route not found.");
  }catch(error){
    if(error instanceof ApiError)return respond(res,error.status,{error:error.message});
    if(error instanceof z.ZodError)return respond(res,400,{error:"Invalid request fields."});
    console.error("API request failed",error instanceof Error?error.message:"Unknown error");
    return respond(res,500,{error:"Internal server error."});
  }
}
