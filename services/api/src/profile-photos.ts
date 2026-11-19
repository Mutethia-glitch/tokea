import { createCipheriv,createDecipheriv,randomBytes,randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rm, readdir, stat } from "node:fs/promises";
import { join,resolve } from "node:path";
import sharp from "sharp";
import { pool } from "./db.js";
import { ApiError } from "./auth.js";

const directory=resolve(process.env.PROFILE_PHOTO_DIR??".profile-photos");
const validKey=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const filePath=(key:string)=> {
  if(!validKey.test(key))throw new ApiError(400,"Invalid profile image.");
  return join(directory,key+".enc");
};
function cryptoKey(){
  if(process.env.PROFILE_PHOTOS_ENABLED!=="true")throw new ApiError(503,"Profile photo sync is not configured.");
  const key=Buffer.from(process.env.PROFILE_PHOTO_KEY_BASE64??"","base64");
  if(key.length!==32)throw new ApiError(503,"Profile photo encryption is not configured.");
  return key;
}
async function encryptImage(input:Buffer){
  const key=cryptoKey();
  if(input.byteLength>5*1024*1024||input.byteLength<1024)
    throw new ApiError(400,"Choose a photo smaller than 5 MB.");
  let jpeg:Buffer;
  try{
    const probe=sharp(input,{failOn:"error",limitInputPixels:25_000_000});
    const meta=await probe.metadata();
    if(!["png","jpeg","webp"].includes(meta.format??""))throw Error("Invalid image type");
    jpeg=await probe.rotate().resize(600,600,{fit:"cover",position:"attention"})
      .jpeg({quality:85}).toBuffer();
  }catch{throw new ApiError(400,"Choose a clear JPG, PNG or WebP profile picture.");}
  const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,iv);
  const encrypted=Buffer.concat([cipher.update(jpeg),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),encrypted]);
}
async function readEncrypted(key:string){
  const raw=await readFile(filePath(key));
  const cipher=createDecipheriv("aes-256-gcm",cryptoKey(),raw.subarray(0,12));
  cipher.setAuthTag(raw.subarray(12,28));
  return Buffer.concat([cipher.update(raw.subarray(28)),cipher.final()]);
}
export async function getMyProfile(userId:string){
  const r=await pool.query<{id:string;display_name:string;phone_e164:string|null;avatar_updated_at:Date|null;avatar_file_key:string|null;age_verified_at:Date|null}>(
    "SELECT id,display_name,phone_e164,avatar_file_key,avatar_updated_at,age_verified_at FROM users WHERE id=$1",[userId]);
  if(!r.rows[0])throw new ApiError(404,"Profile not found.");
  const u=r.rows[0];
  return {id:u.id,displayName:u.display_name,phone:u.phone_e164,
    hasPhoto:!!u.avatar_file_key,photoVersion:u.avatar_updated_at,ageVerified:!!u.age_verified_at};
}
export async function updateMyName(userId:string,name:string){
  await pool.query("UPDATE users SET display_name=$2 WHERE id=$1",[userId,name.trim()]);
  return {displayName:name.trim()};
}
export async function saveMyAvatar(userId:string,image:Buffer){
  const encrypted=await encryptImage(image);
  await mkdir(directory,{recursive:true,mode:0o700});
  const file=randomUUID();
  await writeFile(filePath(file),encrypted,{mode:0o600,flag:"wx"});
  const db=await pool.connect();
  let old:string|null=null,committed=false;
  try{
    await db.query("BEGIN");
    const r=await db.query<{avatar_file_key:string|null}>(
      "SELECT avatar_file_key FROM users WHERE id=$1 FOR UPDATE",[userId]);
    if(!r.rows[0])throw new ApiError(404,"Profile not found.");
    old=r.rows[0].avatar_file_key;
    await db.query("UPDATE users SET avatar_file_key=$2,avatar_updated_at=NOW() WHERE id=$1",[userId,file]);
    if(old)await db.query("INSERT INTO profile_photo_deletions(file_key) VALUES($1) ON CONFLICT DO NOTHING",[old]);
    await db.query("COMMIT");
    committed=true;
  }catch(e){await db.query("ROLLBACK").catch(()=>{});await rm(filePath(file),{force:true});throw e;}
  finally{db.release();}
  if(committed)await drainProfilePhotoDeletions().catch(()=>{});
  return {saved:true};
}
export async function readUserAvatar(userId:string){
  if(!/^[0-9a-f-]{36}$/i.test(userId))throw new ApiError(400,"Invalid user ID.");
  const r=await pool.query<{avatar_file_key:string|null}>(
    "SELECT avatar_file_key FROM users WHERE id=$1 AND is_active=true",[userId]);
  if(!r.rows[0]?.avatar_file_key)throw new ApiError(404,"No profile photo yet.");
  return readEncrypted(r.rows[0].avatar_file_key);
}
export async function removeMyAvatar(userId:string){
  const db=await pool.connect();let old:string|null=null;
  try{
    await db.query("BEGIN");
    const r=await db.query<{avatar_file_key:string|null}>(
      "SELECT avatar_file_key FROM users WHERE id=$1 FOR UPDATE",[userId]);
    if(!r.rows[0])throw new ApiError(404,"Profile not found.");
    old=r.rows[0].avatar_file_key;
    await db.query("UPDATE users SET avatar_file_key=NULL,avatar_updated_at=NOW() WHERE id=$1",[userId]);
    if(old)await db.query("INSERT INTO profile_photo_deletions(file_key) VALUES($1) ON CONFLICT DO NOTHING",[old]);
    await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK");throw e;}finally{db.release();}
  await drainProfilePhotoDeletions().catch(()=>{});
  return {removed:true};
}
/** Explicitly remove old photo blobs; keep retry references only for failures. */
export async function drainProfilePhotoDeletions(){
  if(process.env.PROFILE_PHOTOS_ENABLED!=="true")return 0;
  const tasks=await pool.query<{file_key:string}>(
    "SELECT file_key FROM profile_photo_deletions ORDER BY created_at ASC LIMIT 100");
  let cleaned=0;
  for(const job of tasks.rows){
    try{
      await rm(filePath(job.file_key),{force:true});
      await pool.query("DELETE FROM profile_photo_deletions WHERE file_key=$1",[job.file_key]);
      cleaned++;
    }catch{
      await pool.query("UPDATE profile_photo_deletions SET attempts=attempts+1 WHERE file_key=$1",[job.file_key]);
    }
  }
  return cleaned;
}
/** Remove only orphan photos that are older than the upload grace window. */
export async function sweepProfilePhotoOrphans(){
  if(process.env.PROFILE_PHOTOS_ENABLED!=="true")return 0;
  await mkdir(directory,{recursive:true,mode:0o700});
  const live=await pool.query<{key:string}>(`SELECT avatar_file_key AS key FROM users
    WHERE avatar_file_key IS NOT NULL UNION SELECT file_key AS key FROM profile_photo_deletions`);
  const known=new Set(live.rows.map(r=>r.key));
  let deleted=0;
  for(const item of await readdir(directory,{withFileTypes:true})){
    if(!item.isFile()||!item.name.endsWith(".enc"))continue;
    const key=item.name.slice(0,-4);
    if(!validKey.test(key)||known.has(key))continue;
    const info=await stat(filePath(key));
    if(Date.now()-info.mtimeMs<10*60*1000)continue;
    await rm(filePath(key),{force:true});
    deleted++;
  }
  return deleted;
}

