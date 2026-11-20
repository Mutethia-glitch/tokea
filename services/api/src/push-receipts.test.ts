import {describe,expect,it} from "vitest";
import {receiptResult} from "./push-receipts.js";
describe("Expo push receipts",()=>{
  it("acceptance is not represented as handset delivery",()=>{
    expect(receiptResult({status:"ok"},0,1_000).status).toBe("accepted");
  });
  it("invalidates deleted device tokens",()=>{
    expect(receiptResult({status:"error",details:{error:"DeviceNotRegistered"}},0).error).toBe("DeviceNotRegistered");
  });
  it("does not declare missing receipts delivered",()=>{
    expect(receiptResult(undefined,Date.now()-60_000).status).toBe("unchecked");
    expect(receiptResult(undefined,0,86_400_001).status).toBe("expired");
  });
});
