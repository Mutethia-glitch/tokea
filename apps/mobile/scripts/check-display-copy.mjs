import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { displayCopy } from "../src/display-copy.ts";

assert.equal(displayCopy("First\\nSecond"),"First\nSecond");
assert.equal(displayCopy("First\\r\\nSecond"),"First\nSecond");
assert.equal(displayCopy("One\\tTwo"),"One Two");
assert.equal(displayCopy("An ordinary message"),"An ordinary message");
assert.equal(displayCopy("literal new\nline"),"literal new\nline");

const verification=await readFile(new URL("../app/verification.tsx",import.meta.url),"utf8");
assert.ok(verification.includes("AGE_TIPS.map"),"Age tips must render individual rows");
assert.ok(!verification.includes("\\n•"),"No literal backslash-n bullet list");

const welcome=await readFile(new URL("../app/welcome.tsx",import.meta.url),"utf8");
const adult=welcome.match(/For adults 18\+ only/g)??[];
assert.equal(adult.length,1,"One standalone age notice on welcome");
assert.ok(!welcome.includes("Skip sign-in"),"Native app must not bypass OTP");
console.log("Native display-copy and adult-only welcome checks passed.");
