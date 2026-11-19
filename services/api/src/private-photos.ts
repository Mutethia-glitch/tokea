import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile, chmod, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import sharp from "sharp";
import { ApiError } from "./auth.js";

const DIRECTORY=resolve(process.env.VERIFICATION_PHOTO_DIR??".private-verification");
const UUID=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const KEY=process.env.VERIFICATION_ENCRYPTION_KEY_BASE64;
function requireKey() {
  if(process.env.VERIFICATION_UPLOADS_ENABLED!=="true") throw new ApiError(503,"Age document uploads are not yet enabled.");
  const key=Buffer.from(KEY??"","base64");
  if(key.length!==32)throw new ApiError(503,"Document encryption has not been configured.");
  return key;
}
function pathFor(id:string) {
  if(!UUID.test(id))throw new ApiError(400,"Invalid image reference.");
  return join(DIRECTORY,id+".enc");
}
export async function prepareStore() {
  requireKey();
  await mkdir(DIRECTORY,{recursive:true,mode:0o700});
  await chmod(DIRECTORY,0o700);
}
export async function savePhoto(bytes:Buffer,kind:"id"|"selfie") {
  const key=requireKey();
  if(bytes.length<1024||bytes.length>5*1024*1024)
    throw new ApiError(400,"Choose a clear image between 1 KB and 5 MB.");
  let processed:Buffer;
  try {
    const probe=sharp(bytes,{failOn:"error",limitInputPixels:30_000_000});
    const meta=await probe.metadata();
    if(!["jpeg","png","webp"].includes(meta.format??"")||(meta.pages??1)>1)
      throw Error("Unsupported image");
    if((meta.width??0)<(kind==="id"?800:600)||(meta.height??0)<(kind==="id"?450:600))
      throw new ApiError(400,kind==="id"?"Use a sharper, larger picture of your ID.":"Use a clear, high-resolution selfie.");
    // Strip EXIF, GPS, ICC and other embedded metadata. No biometric template is computed.
    processed=await probe.rotate().resize({width:2500,height:2500,fit:"inside",withoutEnlargement:true})
      .jpeg({quality:88}).toBuffer();
  } catch(e) {
    if(e instanceof ApiError)throw e;
    throw new ApiError(400,"Image could not be read. Use a clear JPG, PNG or WebP.");
  }
  await prepareStore();
  const iv=randomBytes(12);
  const cipher=createCipheriv("aes-256-gcm",key,iv);
  const data=Buffer.concat([cipher.update(processed),cipher.final()]);
  const file=Buffer.concat([iv,cipher.getAuthTag(),data]);
  const id=randomUUID();
  await writeFile(pathFor(id),file,{mode:0o600,flag:"wx"});
  return id;
}
export async function readPhoto(id:string) {
  const key=requireKey();
  const raw=await readFile(pathFor(id));
  if(raw.length<29)throw Error("Corrupt encrypted image.");
  const cipher=createDecipheriv("aes-256-gcm",key,raw.subarray(0,12));
  cipher.setAuthTag(raw.subarray(12,28));
  return Buffer.concat([cipher.update(raw.subarray(28)),cipher.final()]);
}
export async function removePhoto(id:string|null|undefined) {
  if(!id)return;
  await rm(pathFor(id),{force:true});
}

/** Reclaim abandoned encrypted files, without deleting in-flight image uploads. */
export async function sweepUnreferencedPhotos(activeKeys:Set<string>,graceMs=10*60*1000){
  if(process.env.VERIFICATION_UPLOADS_ENABLED!=="true")return 0;
  const entries=await readdir(DIRECTORY,{withFileTypes:true});
  let removed=0;
  for(const item of entries){
    if(!item.isFile()||!item.name.endsWith(".enc"))continue;
    const id=item.name.slice(0,-4);
    if(!UUID.test(id)||activeKeys.has(id))continue;
    try{
      const info=await stat(pathFor(id));
      if(Date.now()-info.mtimeMs<graceMs)continue;
      await removePhoto(id);
      removed++;
    }catch(error){
      if((error as NodeJS.ErrnoException)?.code==="ENOENT")continue;
      console.error("Orphan photo cleanup error",error instanceof Error?error.message:"Unknown failure");
    }
  }
  return removed;
}
