import sharp from "sharp";
import { readFile, mkdir, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const mobileRoot=dirname(dirname(fileURLToPath(import.meta.url)));
const assetDir=join(mobileRoot,"assets");
const svg=(await readFile(join(assetDir,"tokea-app-icon.svg"),"utf8")).trim();
const rect=/<rect width="24" height="24" fill="#7048D9"\s*\/>/;
if(!rect.test(svg)||!svg.includes('stroke="#FFFDF8"'))throw Error("Unexpected Tokea source SVG; do not generate replacement artwork.");

const markSvg=svg.replace(rect,"");
const purpleMarkSvg=markSvg.replace('stroke="#FFFDF8"','stroke="#7048D9"');
await mkdir(assetDir,{recursive:true});
async function png(source,name,size=1024){
  await sharp(Buffer.from(source),{density:384}).resize(size,size)
    .png({compressionLevel:9}).toFile(join(assetDir,name));
}
await png(svg,"icon.png");
await png(markSvg,"adaptive-icon.png");
await copyFile(join(assetDir,"adaptive-icon.png"),join(assetDir,"monochrome-icon.png"));
await png(purpleMarkSvg,"brand-mark.png",128);
console.log("Generated Tokea exact-brand launcher, Android adaptive/themed, and inline logo PNG assets.");
