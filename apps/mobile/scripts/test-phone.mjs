import { strict as assert } from "node:assert";
import { normalizeKenyanPhone, maskedKenyanPhone } from "../src/phone.ts";
for (const value of ["0712345678", "0712 345 678", "254712345678", "+254712345678", "(0712) 345-678"]) {
  assert.equal(normalizeKenyanPhone(value), "+254712345678");
}
assert.equal(normalizeKenyanPhone("0112345678"), "+254112345678");
for (const invalid of ["", "070123", "+254812345678", "07000000000", "077abc1234", "+254712345678123"]) {
  assert.equal(normalizeKenyanPhone(invalid), null);
}
assert.equal(maskedKenyanPhone("+254712345678"), "+254712•••678");
console.log("Native Kenyan phone input tests passed.");
