import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { pool } from "./db.js";
import { createSession, discoverSessions, getSession } from "./sessions.js";
import { cancelRequest, listRequests, requestToJoin } from "./requests.js";
import { decideJoinRequest } from "./decisions.js";
import { getMessages, sendMessage } from "./messages.js";
import { getInbox } from "./inbox.js";
import { registerDevice } from "./devices.js";

const hasDB=Boolean(process.env.DATABASE_URL);
const host=randomUUID(),guest=randomUUID(),stranger=randomUUID(),other=randomUUID();
let sessionId="",requestId="";
async function insertUser(id:string,name:string) {
  await pool.query("INSERT INTO users(id,display_name,age_verified_at) VALUES($1,$2,NOW())",[id,name]);
}
describe.skipIf(!hasDB)("Native app session/request/chat API service integration",()=>{
  it("validates and discovers a PostgreSQL session without precise coordinates",async()=>{
    await insertUser(host,"Local host");
    await insertUser(guest,"Local guest");
    await insertUser(stranger,"No membership");
    await insertUser(other,"Other member");
    const start=new Date(Date.now()+60*60*1000).toISOString();
    const end=new Date(Date.now()+3*60*60*1000).toISOString();
    const created=await createSession(host,{title:"Muratina meet & greet",category:"Muratina",
      neighbourhood:"Kileleshwa",guestCapacity:2,startsAt:start,endsAt:end});
    sessionId=created.id;
    const discovered=await discoverSessions(guest,{category:"Muratina"});
    const found=discovered.find(s=>s.id===sessionId);
    expect(found?.seatsLeft).toBe(2);
    expect(found?.hostName).toBe("Local host");
    expect(JSON.stringify(found)).not.toMatch(/latitude|longitude|gps|coordinates/i);
    expect((await getSession(guest,sessionId)).category).toBe("Muratina");
    expect((await discoverSessions(guest,{category:"Vodka"})).some(s=>s.id===sessionId)).toBe(false);
  });
  it("notifies host on joining; protects the chat until approval",async()=>{
    await registerDevice(host,`ExpoPushToken[host_${host.replaceAll("-","")}]`,"android");
    const result=await requestToJoin(guest,sessionId,{partySize:1,intro:"I'd love to join."});
    requestId=result.requestId;
    expect(result.status).toBe("pending");
    expect((await getInbox(host)).some(n=>n.kind==="request_received"&&n.id===result.notificationId)).toBe(true);
    const requestList=await listRequests(host);
    expect(requestList.incoming.some(r=>r.id===requestId)).toBe(true);
    expect((await listRequests(guest)).sent.some(r=>r.id===requestId)).toBe(true);
    await expect(getMessages(guest,sessionId)).rejects.toMatchObject({status:403});
    await expect(sendMessage(stranger,sessionId,"Hello")).rejects.toMatchObject({status:403});
    await expect(requestToJoin(guest,sessionId,{partySize:1,intro:"Again"})).rejects.toMatchObject({status:409});
    const pushed=await pool.query<{n:number}>("SELECT COUNT(*)::int AS n FROM push_deliveries WHERE notification_id=$1",[result.notificationId]);
    expect(pushed.rows[0]?.n).toBe(1);
  });
  it("allows accepted participants to chat; hides message contents from notification bodies",async()=>{
    await decideJoinRequest(host,sessionId,requestId,"accepted");
    const sent=await sendMessage(guest,sessionId,"Meeting at a public venue.");
    expect(sent.text).toBe("Meeting at a public venue.");
    const messages=await getMessages(host,sessionId);
    expect(messages.map(m=>m.id)).toContain(sent.id);
    await expect(getMessages(stranger,sessionId)).rejects.toMatchObject({status:403});
    const inbox=await getInbox(host);
    expect(inbox.some(n=>n.kind==="new_message"&&n.body==="You have a new message in Tokea.")).toBe(true);
    expect(inbox.every(n=>!n.body.includes("Meeting at"))).toBe(true);
    expect((await discoverSessions(guest,{})).find(s=>s.id===sessionId)?.seatsLeft).toBe(1);
  });
  it("cancels pending requests and respects blocks",async()=>{
    const request=await requestToJoin(other,sessionId,{partySize:1,intro:"Joining too"});
    await cancelRequest(other,request.requestId);
    expect((await listRequests(other)).sent.find(r=>r.id===request.requestId)?.status).toBe("cancelled");
    await pool.query("INSERT INTO user_blocks(blocker_user_id,blocked_user_id) VALUES($1,$2)",[guest,host]);
    expect((await discoverSessions(guest,{})).some(s=>s.id===sessionId)).toBe(false);
    await expect(sendMessage(guest,sessionId,"Should be blocked")).rejects.toMatchObject({status:403});
  });
});
afterAll(async()=>{if(hasDB)await pool.end();});
