import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import type { AuthenticatedUser } from "./auth.js";

const enabled=Boolean(process.env.DATABASE_URL);
const userId=randomUUID(),declinedId=randomUUID(),expiredId=randomUUID();
const ownerId=randomUUID(),reviewerId=randomUUID();
const actor=(id:string,verified=false):AuthenticatedUser=>({
  id,email:null,emailVerified:false,ageVerified:verified,
});
let folder="",caseId="",idPhoto="",selfiePhoto="";
let localPool:(typeof import("./db.js"))["pool"];
let verification:typeof import("./verification.js");
let store:typeof import("./private-photos.js");
let idSample:Buffer,selfieSample:Buffer;

describe.skipIf(!enabled)("Human age review, secure photos, and immutable staff decisions",()=>{
  beforeAll(async()=>{
    folder=await mkdtemp(join(tmpdir(),"tokea-test-age-"));
    process.env.VERIFICATION_UPLOADS_ENABLED="true";
    process.env.VERIFICATION_ENCRYPTION_KEY_BASE64=randomBytes(32).toString("base64");
    process.env.VERIFICATION_PHOTO_DIR=folder;
    ({pool:localPool}=await import("./db.js"));
    verification=await import("./verification.js");
    store=await import("./private-photos.js");
    idSample=await sharp({create:{width:1100,height:720,channels:3,
      background:{r:220,g:225,b:210}}}).jpeg().toBuffer();
    selfieSample=await sharp({create:{width:900,height:900,channels:3,
      background:{r:200,g:205,b:215}}}).png().toBuffer();
    for(const [id,name] of [
      [userId,"Adult applicant"],[declinedId,"Declined applicant"],[expiredId,"Expired applicant"],
      [ownerId,"Owner"],[reviewerId,"Reviewer"],
    ])await localPool.query("INSERT INTO users(id,display_name) VALUES($1,$2)",[id,name]);
    await localPool.query("INSERT INTO admin_memberships(user_id,role) VALUES($1,'owner'),($2,'reviewer')",
      [ownerId,reviewerId]);
  },30_000);
  afterAll(async()=>{
    if(localPool)await localPool.end();
    if(folder)await rm(folder,{recursive:true,force:true});
    delete process.env.VERIFICATION_UPLOADS_ENABLED;
    delete process.env.VERIFICATION_ENCRYPTION_KEY_BASE64;
    delete process.env.VERIFICATION_PHOTO_DIR;
  });

  it("requires consent, re-encodes images and retains encrypted photo bytes before review",async()=>{
    await expect(verification.uploadDocument(actor(userId),"id",idSample,false))
      .rejects.toMatchObject({status:400});
    await verification.uploadDocument(actor(userId),"id",idSample,true);
    await verification.uploadDocument(actor(userId),"selfie",selfieSample,true);
    const row=await localPool.query<{id:string;id_file_key:string;selfie_file_key:string;consent_at:Date}>(
      "SELECT id,id_file_key,selfie_file_key,consent_at FROM age_verification_cases WHERE user_id=$1",[userId]);
    caseId=row.rows[0]!.id;idPhoto=row.rows[0]!.id_file_key;selfiePhoto=row.rows[0]!.selfie_file_key;
    expect(row.rows[0]!.consent_at).toBeTruthy();
    const image=await store.readPhoto(idPhoto);
    expect(image.subarray(0,2).toString("hex")).toBe("ffd8");
    expect((await verification.getVerificationStatus(userId)).verified).toBe(false);
    await expect(verification.viewReviewPhoto(actor(userId),caseId,"id"))
      .rejects.toMatchObject({status:403});
    await expect(verification.viewReviewPhoto(actor(reviewerId),caseId,"id"))
      .rejects.toMatchObject({status:404});
  });

  it("submits to reviewer queue and records a five-minute target, not a guaranteed timer",async()=>{
    const submitted=await verification.submitVerification(actor(userId));
    expect(submitted.status).toBe("pending");
    expect(submitted.message).toMatch(/aims to review within 5 minutes/i);
    expect((await verification.getVerificationStatus(userId)).status).toBe("pending");
    const queue=await verification.listReviewQueue(actor(ownerId));
    expect(queue.some(q=>q.id===caseId)).toBe(true);
    const photo=await verification.viewReviewPhoto(actor(reviewerId),caseId,"selfie");
    expect(photo.subarray(0,2).toString("hex")).toBe("ffd8");
    const inbox=await (await import("./inbox.js")).getInbox(userId);
    expect(inbox.some(x=>x.kind==="verification_submitted")).toBe(true);
  });

  it("accepts only one simultaneous final decision and immediately unlocks approved account",async()=>{
    const decisions=await Promise.allSettled([
      verification.decideVerification(actor(ownerId),caseId,{decision:"verified"}),
      verification.decideVerification(actor(reviewerId),caseId,{decision:"verified"}),
    ]);
    expect(decisions.filter(x=>x.status==="fulfilled")).toHaveLength(1);
    expect(decisions.filter(x=>x.status==="rejected")).toHaveLength(1);
    await expect(verification.decideVerification(actor(reviewerId),caseId,{decision:"declined",reason:"Changed mind"}))
      .rejects.toMatchObject({status:409});
    const row=await localPool.query<{
      status:string;reviewed_by:string;id_file_key:string|null;selfie_file_key:string|null;
    }>("SELECT status,reviewed_by,id_file_key,selfie_file_key FROM age_verification_cases WHERE id=$1",[caseId]);
    expect(row.rows[0]!.status).toBe("verified");
    expect([ownerId,reviewerId]).toContain(row.rows[0]!.reviewed_by);
    expect(row.rows[0]!.id_file_key).toBeNull();
    expect(row.rows[0]!.selfie_file_key).toBeNull();
    const account=await localPool.query<{age_verified_at:Date|null}>("SELECT age_verified_at FROM users WHERE id=$1",[userId]);
    expect(account.rows[0]?.age_verified_at).toBeTruthy();
    expect((await verification.getVerificationStatus(userId)).verified).toBe(true);
    await expect(store.readPhoto(idPhoto)).rejects.toThrow();
    await expect(store.readPhoto(selfiePhoto)).rejects.toThrow();
    await expect(localPool.query("UPDATE age_verification_cases SET status='declined' WHERE id=$1",[caseId]))
      .rejects.toMatchObject({code:"23514"});
    const inbox=await (await import("./inbox.js")).getInbox(userId);
    expect(inbox.some(x=>x.kind==="verification_approved")).toBe(true);
  });

  it("declines with a reason and permits a new submission without changing the old decision",async()=>{
    await verification.uploadDocument(actor(declinedId),"id",idSample,true);
    await verification.uploadDocument(actor(declinedId),"selfie",selfieSample,true);
    await verification.submitVerification(actor(declinedId));
    const row=await localPool.query<{id:string}>(
      "SELECT id FROM age_verification_cases WHERE user_id=$1",[declinedId]);
    await verification.decideVerification(actor(reviewerId),row.rows[0]!.id,
      {decision:"declined",reason:"ID date of birth isn't legible"});
    expect((await verification.getVerificationStatus(declinedId)).status).toBe("declined");
    const account=await localPool.query<{age_verified_at:Date|null}>(
      "SELECT age_verified_at FROM users WHERE id=$1",[declinedId]);
    expect(account.rows[0]!.age_verified_at).toBeNull();
    await verification.uploadDocument(actor(declinedId),"id",idSample,true);
    const all=await localPool.query<{status:string}>(
      "SELECT status FROM age_verification_cases WHERE user_id=$1 ORDER BY created_at",[declinedId]);
    expect(all.rows.map(x=>x.status).sort()).toEqual(["declined","draft"]);
  });

  it("expires pending photos after the 24-hour limit and prevents further staff access",async()=>{
    const one=await store.savePhoto(idSample,"id"),two=await store.savePhoto(selfieSample,"selfie");
    const row=await localPool.query<{id:string}>(`INSERT INTO age_verification_cases
      (user_id,status,id_file_key,selfie_file_key,submitted_at,expires_at,consent_at)
      VALUES($1,'pending',$2,$3,NOW()-INTERVAL '25 hours',NOW()-INTERVAL '1 hour',NOW()-INTERVAL '25 hours')
      RETURNING id`,[expiredId,one,two]);
    const id=row.rows[0]!.id;
    expect(await verification.purgeExpiredVerificationPhotos()).toBeGreaterThanOrEqual(1);
    const expired=await localPool.query<{status:string;id_file_key:string|null}>(
      "SELECT status,id_file_key FROM age_verification_cases WHERE id=$1",[id]);
    expect(expired.rows[0]!.status).toBe("expired");
    expect(expired.rows[0]!.id_file_key).toBeNull();
    await expect(store.readPhoto(one)).rejects.toThrow();
    await expect(store.readPhoto(two)).rejects.toThrow();
    await expect(verification.viewReviewPhoto(actor(reviewerId),id,"id"))
      .rejects.toMatchObject({status:404});
    await expect(verification.decideVerification(actor(ownerId),id,{decision:"verified"}))
      .rejects.toMatchObject({status:409});
    const queue=await localPool.query<{total:string}>(`SELECT COUNT(*)::text AS total
      FROM verification_photo_deletions WHERE deleted_at IS NULL`);
    expect(Number(queue.rows[0]?.total)).toBe(0);
    const inbox=await (await import("./inbox.js")).getInbox(expiredId);
    expect(inbox.some(x=>x.kind==="verification_expired")).toBe(true);
  });
});
