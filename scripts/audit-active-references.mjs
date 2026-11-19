import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

const root=resolve(".");
const archived=join(root,"src")+sep;
const active=[join(root,"apps","mobile"),join(root,"services","api","src"),join(root,"services","api","admin")];
const extensions=/\.(ts|tsx|js|jsx|mjs|html)$/;
const errors=[];
let count=0;
async function walk(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(["node_modules","dist",".expo",".expo-dist"].includes(entry.name))continue;
    const full=join(dir,entry.name);
    if(entry.isDirectory())await walk(full);
    else if(entry.isFile()&&extensions.test(entry.name)){
      count++;
      const code=await readFile(full,"utf8");
      // The root Lovable prototype is an image/design reference, never a runtime dependency.
      for(const match of code.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)["']([^"']+)["']/g)){
        const target=match[1];
        if(!target?.startsWith("."))continue;
        const resolved=resolve(dirname(full),target);
        if(resolved.startsWith(archived))errors.push(full+" imports archived "+target);
      }
      if(/\bsrc\/lib\/demo-store\b|tokea-demo\.vercel\.app/.test(code))
        errors.push(full+" references demo-only runtime data or hosted prototype");
    }
  }
}
for(const dir of active)await walk(dir);
if(errors.length){
  for(const message of errors)console.error(message);
  process.exitCode=1;
}else console.log("Active-source audit passed:",count,"native/API/staff files; no web fallback.");
