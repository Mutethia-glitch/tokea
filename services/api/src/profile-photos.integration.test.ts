import {randomBytes,randomUUID} from "node:crypto";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import sharp from "sharp";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {pool} from "./db.js";

const enabled=Boolean(process.env.DATABASE_URL);
let dir="",profile:typeof import("./profile-photos.js"),id="";
describe.skipIf(!enabled)("Persistent encrypted profile image",()=>{
  beforeAll(async()=>{
    dir=await mkdtemp(join(tmpdir(),"tokea-profile-"));
    process.env.PROFILE_PHOTOS_ENABLED="true";
    process.env.PROFILE_PHOTO_DIR=dir;
    process.env.PROFILE_PHOTO_KEY_BASE64=randomBytes(32).toString("base64");
    profile=await import("./profile-photos.js");
    id=randomUUID();
    await pool.query("INSERT INTO users(id,display_name) VALUES($1,'Profile owner')",[id]);
  });
  afterAll(async()=>{
    await pool.end();
    if(dir)await rm(dir,{recursive:true,force:true});
    delete process.env.PROFILE_PHOTOS_ENABLED;
    delete process.env.PROFILE_PHOTO_KEY_BASE64;
    delete process.env.PROFILE_PHOTO_DIR;
  });
  it("keeps profile photo independently of 24h ID photos",async()=>{
    const img=await sharp({create:{width:640,height:640,channels:3,
      background:{r:160,g:90,b:60}}}).jpeg().toBuffer();
    expect((await profile.getMyProfile(id)).hasPhoto).toBe(false);
    await profile.saveMyAvatar(id,img);
    const data=await profile.getMyProfile(id);
    expect(data.hasPhoto).toBe(true);
    expect(data.photoVersion).toBeTruthy();
    expect((await profile.readUserAvatar(id)).subarray(0,2).toString("hex")).toBe("ffd8");
    const oldKey=await pool.query<{avatar_file_key:string}>(
      "SELECT avatar_file_key FROM users WHERE id=$1",[id]);
    await profile.saveMyAvatar(id,img);
    const key=await pool.query<{avatar_file_key:string}>(
      "SELECT avatar_file_key FROM users WHERE id=$1",[id]);
    expect(key.rows[0]!.avatar_file_key).not.toBe(oldKey.rows[0]!.avatar_file_key);
    const obsolete=await pool.query<{n:number}>(`SELECT COUNT(*)::int AS n
      FROM profile_photo_deletions WHERE file_key=$1`,[oldKey.rows[0]!.avatar_file_key]);
    expect(obsolete.rows[0]!.n).toBe(0);
    await profile.removeMyAvatar(id);
    expect((await profile.getMyProfile(id)).hasPhoto).toBe(false);
    await expect(profile.readUserAvatar(id)).rejects.toMatchObject({status:404});
  });
});
