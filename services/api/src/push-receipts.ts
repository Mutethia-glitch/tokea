import { pool } from "./db.js";

export type ExpoReceipt={status?:"ok"|"error";message?:string;details?:{error?:string}};
export function receiptResult(receipt:ExpoReceipt|undefined,submittedAtMs:number,nowMs=Date.now()){
  if(!receipt){
    return nowMs-submittedAtMs>24*60*60*1000
      ?{status:"expired" as const,error:"Push receipt was not available within 24 hours"}
      :{status:"unchecked" as const,error:null};
  }
  if(receipt.status==="ok")return {status:"accepted" as const,error:null};
  return {status:"error" as const,error:String(receipt.details?.error??receipt.message??"Push provider error").slice(0,250)};
}
/** Expo receipt OK confirms Apple/Google acceptance, not display on a phone. */
export async function checkPushReceipts(){
  if(!process.env.EXPO_ACCESS_TOKEN)throw Error("Expo push worker not configured.");
  const submitted=await pool.query<{id:string;ticket_id:string;device_id:string;updated_at:Date}>(`SELECT id,ticket_id,device_id,updated_at
    FROM push_deliveries WHERE status='sent' AND ticket_id IS NOT NULL
      AND receipt_status='unchecked' AND updated_at<NOW()-INTERVAL '2 minutes'
    ORDER BY updated_at ASC LIMIT 200`);
  if(!submitted.rows.length)return 0;
  const response=await fetch("https://exp.host/--/api/v2/push/getReceipts",{
    method:"POST",headers:{"content-type":"application/json",
      Authorization:`Bearer ${process.env.EXPO_ACCESS_TOKEN}`},
    body:JSON.stringify({ids:submitted.rows.map(x=>x.ticket_id)}),
    signal:AbortSignal.timeout(15_000),
  });
  if(!response.ok)throw Error(`Expo receipt API HTTP ${response.status}`);
  const raw=await response.json() as {data?:Record<string,ExpoReceipt>};
  let checked=0;
  for(const row of submitted.rows){
    const parsed=receiptResult(raw.data?.[row.ticket_id],row.updated_at.getTime());
    if(parsed.status==="unchecked")continue;
    await pool.query(`UPDATE push_deliveries SET receipt_status=$2,receipt_checked_at=NOW(),
      last_error=CASE WHEN $3::text IS NULL THEN last_error ELSE $3 END WHERE id=$1`,
      [row.id,parsed.status,parsed.error]);
    if(parsed.error==="DeviceNotRegistered")
      await pool.query("UPDATE push_devices SET enabled=false,updated_at=NOW() WHERE id=$1",[row.device_id]);
    checked++;
  }
  return checked;
}
