import type { PoolClient } from "pg";
/** Notifications and push jobs are committed atomically with business operations. */
export async function enqueueNotice(
  db:PoolClient,recipientId:string,kind:string,title:string,body:string,route:string,
) {
  const result=await db.query<{id:string}>(`INSERT INTO notifications
    (recipient_user_id,kind,title,body,app_route)
    VALUES($1,$2,$3,$4,$5) RETURNING id`,[recipientId,kind,title,body,route]);
  const id=result.rows[0]!.id;
  await db.query(`INSERT INTO push_deliveries(notification_id,device_id)
    SELECT $1,id FROM push_devices WHERE user_id=$2 AND enabled=true
    ON CONFLICT (notification_id,device_id) DO NOTHING`,[id,recipientId]);
  return id;
}
