import {createHmac,generateKeyPairSync,randomBytes,randomUUID} from "node:crypto";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {kenyaPhoneSchema,hashOtp,verifyPhoneCode,refreshPhoneSession,revokePhoneSession,requestPhoneCode} from "./phone-auth.js";
import {verifyLocalAccessToken} from "./local-identity.js";
import {pool} from "./db.js";

const enabled=Boolean(process.env.DATABASE_URL);
let temporary="",pepper="",userId="";
const phone="+2547"+String(Math.floor(Math.random()*1e8)).padStart(8,"0");
describe.skipIf(!enabled)("Africa's Talking OTP security and signed app sessions",()=>{
  beforeAll(async()=>{
    temporary=await mkdtemp(join(tmpdir(),"tokea-phone-"));
    const {privateKey}=generateKeyPairSync("rsa",{modulusLength:2048});
    const path=join(temporary,"key.pem");
    await writeFile(path,privateKey.export({format:"pem",type:"pkcs8"}));
    pepper=randomBytes(32).toString("hex");
    process.env.OTP_HMAC_SECRET=pepper;
    process.env.AUTH_PRIVATE_KEY_FILE=path;
    process.env.OTP_AUTH_ENABLED="true";
  });
  afterAll(async()=>{
    delete process.env.OTP_HMAC_SECRET;
    delete process.env.AUTH_PRIVATE_KEY_FILE;
    delete process.env.OTP_AUTH_ENABLED;
    await pool.end();
    if(temporary)await rm(temporary,{recursive:true,force:true});
  });
  it("accepts Kenya mobile formats but rejects non-Kenyan numbers",()=>{
    expect(kenyaPhoneSchema.parse("+254712345678")).toBe("+254712345678");
    expect(kenyaPhoneSchema.parse("+254112345678")).toBe("+254112345678");
    expect(kenyaPhoneSchema.safeParse("+447000000000").success).toBe(false);
    expect(kenyaPhoneSchema.safeParse("0712345678").success).toBe(false);
  });
  it("cannot send OTP without a configured real SMS provider",async()=>{
    const old=process.env.AT_API_KEY;
    delete process.env.AT_API_KEY;
    await expect(requestPhoneCode(phone)).rejects.toMatchObject({status:503});
    if(old)process.env.AT_API_KEY=old;
  });
  it("hashes OTP, checks wrong codes, and issues a real signed adult-unverified access token",async()=>{
    const code="384791";
    const hashed=hashOtp(phone,code);
    expect(hashed).not.toContain(code);
    await pool.query(`INSERT INTO phone_login_codes(phone_e164,code_hmac,expires_at)
      VALUES($1,$2,NOW()+INTERVAL '5 minutes')`,[phone,hashed]);
    await expect(verifyPhoneCode(phone,"000000")).rejects.toMatchObject({status:401});
    const attempts=await pool.query<{attempts:number}>(
      "SELECT attempts FROM phone_login_codes WHERE phone_e164=$1",[phone]);
    expect(attempts.rows[0]!.attempts).toBe(1);
    const session=await verifyPhoneCode(phone,code);
    userId=session.userId;
    expect(session.ageVerified).toBe(false);
    expect(session.accessToken.split(".")).toHaveLength(3);
    const payload=await verifyLocalAccessToken(session.accessToken);
    expect(payload.sub).toBe(userId);
    expect((await pool.query("SELECT 1 FROM phone_login_codes WHERE phone_e164=$1",[phone])).rowCount).toBe(0);
    const refreshed=await refreshPhoneSession(session.refreshToken);
    expect((await verifyLocalAccessToken(refreshed.accessToken)).sub).toBe(userId);
    await expect(refreshPhoneSession(session.refreshToken)).rejects.toMatchObject({status:401});
    expect((await revokePhoneSession(refreshed.refreshToken)).signedOut).toBe(true);
    await expect(refreshPhoneSession(refreshed.refreshToken)).rejects.toMatchObject({status:401});
  });
});
