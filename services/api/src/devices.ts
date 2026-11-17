import { pool } from "./db.js";
import { ApiError } from "./auth.js";

const expoToken = /^(ExpoPushToken|ExponentPushToken)\[[A-Za-z0-9_=-]+\]$/;

export function validExpoToken(token: string) {
  return token.length <= 255 && expoToken.test(token);
}

export async function registerDevice(userId: string, token: string, platform: "android" | "ios") {
  if (!validExpoToken(token)) throw new ApiError(400, "Invalid Expo push token.");
  const result = await pool.query<{ id: string }>(
    `INSERT INTO push_devices (user_id, expo_push_token, platform, enabled)
      VALUES ($1,$2,$3,true)
      ON CONFLICT(expo_push_token)
      DO UPDATE SET user_id=EXCLUDED.user_id, platform=EXCLUDED.platform, enabled=true, updated_at=NOW()
      RETURNING id`,
    [userId, token, platform],
  );
  return { deviceId: result.rows[0]?.id, registered: true };
}

export async function unregisterDevice(userId: string, deviceId: string) {
  const result = await pool.query(
    "UPDATE push_devices SET enabled=false, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING id",
    [deviceId, userId],
  );
  if (!result.rowCount) throw new ApiError(404, "Device not found.");
  return { registered: false };
}
