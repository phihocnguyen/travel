import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import sharp from "sharp";

const require=createRequire(import.meta.url);
const ts=require("typescript");
async function load(path,overrides={}) {
  const source=await readFile(new URL(path,import.meta.url),"utf8");
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  const sandbox={exports:{},Buffer,require(name){return name==="server-only"?{}:overrides[name]??require(name);}};
  runInNewContext(code,sandbox);return sandbox.exports;
}
const settings=await load("../lib/tickets/print-settings.ts");
const {colorPrintPng}=await load("../lib/tickets/print-image.ts",{"./print-settings":settings});
const {PRINT_WIDTH:width,PRINT_HEIGHT:height,PRINT_DPI:dpi}=settings;
const source=await sharp(Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="${width/2}" height="${height}" fill="#ff0000"/><rect x="${width/2}" width="${width/2}" height="${height}" fill="#00aa66"/><text x="120" y="200" font-size="100" fill="black">VXDL000</text></svg>`)).png().toBuffer();
const output=await colorPrintPng(source);
const meta=await sharp(output).metadata();
assert.equal(meta.width,width);assert.equal(meta.height,height);assert.equal(meta.density,dpi);
assert.ok(width>1920 && height>1080);
assert.equal(meta.hasAlpha,false,"Print output must have an opaque white background");
const {data,info}=await sharp(output).toColourspace("srgb").removeAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(info.channels,3);
assert.ok(data.some((value,index)=>index%3===0 && Math.abs(value-data[index+1])>30), "Print colors must be preserved");
const low=await sharp({create:{width:1920,height:1080,channels:3,background:"red"}}).png().toBuffer();
await assert.rejects(()=>colorPrintPng(low),/PRINT_RESOLUTION_TOO_LOW/);
await assert.rejects(()=>colorPrintPng(Buffer.from("broken image")));
const wrongRatio=await sharp({create:{width:4120,height:4120,channels:3,background:"red"}}).png().toBuffer();
await assert.rejects(()=>colorPrintPng(wrongRatio),/PRINT_ASPECT_RATIO/);
console.log(`Print verified: ${width} x ${height}, ${dpi} DPI, sRGB colors preserved, no transparency; rejects low-resolution, corrupt and wrong-ratio input.`);
