import { createServer } from "node:http";
import { pool } from "./db.js";
import { route } from "./routes.js";
import { processPushBatch } from "./worker.js";
import { checkPushReceipts } from "./push-receipts.js";
import { prepareStore } from "./private-photos.js";
import { purgeExpiredVerificationPhotos } from "./verification.js";
import { purgeFinishedInvitations } from "./admin-invites.js";

const port=Number(process.env.PORT||"4400");
if(process.env.VERIFICATION_UPLOADS_ENABLED==="true")await prepareStore();
const server=createServer((req,res)=>{void route(req,res);});
server.requestTimeout=10_000;
server.headersTimeout=15_000;
// Local development only. Do not expose private ID images to a LAN or public network.
server.listen(port,"127.0.0.1",()=>console.log(`Tokea API at http://127.0.0.1:${port}`));
let worker:ReturnType<typeof setInterval>|null=null;
let receiptWorker:ReturnType<typeof setInterval>|null=null;
if(process.env.ENABLE_PUSH_WORKER==="true"){
  if(!process.env.EXPO_ACCESS_TOKEN)throw Error("EXPO_ACCESS_TOKEN required for push worker.");
  worker=setInterval(()=>void processPushBatch().catch(e=>console.error("Push worker error",e)),5000);
  receiptWorker=setInterval(()=>void checkPushReceipts()
    .catch(e=>console.error("Push receipt check failed",e)),120_000);
}
let photoCleanup:ReturnType<typeof setInterval>|null=null;
if(process.env.VERIFICATION_UPLOADS_ENABLED==="true"){
  await purgeExpiredVerificationPhotos();
  photoCleanup=setInterval(()=>void purgeExpiredVerificationPhotos()
    .catch(e=>console.error("Identity document expiration cleanup error",e)),30_000);
}
void purgeFinishedInvitations().catch(e=>console.error("Invite cleanup error",e));
const inviteCleanup=setInterval(()=>void purgeFinishedInvitations()
  .catch(e=>console.error("Invite cleanup error",e)),60_000);
async function stop(){
  if(worker)clearInterval(worker);
  if(receiptWorker)clearInterval(receiptWorker);
  if(photoCleanup)clearInterval(photoCleanup);
  clearInterval(inviteCleanup);
  server.close();
  await pool.end();
}
process.once("SIGINT",()=>void stop());
process.once("SIGTERM",()=>void stop());
