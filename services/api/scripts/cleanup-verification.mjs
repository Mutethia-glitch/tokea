// One-shot photo expiry and deletion check for local automation.
// Never accept personal IDs while running unmonitored on a sleeping workstation.
if(process.env.VERIFICATION_UPLOADS_ENABLED!=="true") {
  console.log("Verification uploads are disabled. No private photos to process.");
} else {
  const {pool}=await import("../src/db.ts");
  try {
    const {prepareStore}=await import("../src/private-photos.ts");
    const {purgeExpiredVerificationPhotos,drainPhotoDeletionQueue}=await import("../src/verification.ts");
    await prepareStore();
    const expired=await purgeExpiredVerificationPhotos();
    const removed=await drainPhotoDeletionQueue();
    const pending=await pool.query(
      "SELECT COUNT(*)::int AS count FROM verification_photo_deletions WHERE deleted_at IS NULL");
    const late=await pool.query(
      "SELECT COUNT(*)::int AS count FROM verification_photo_deletions WHERE deleted_at IS NULL AND created_at < NOW()-INTERVAL '5 minutes'");
    console.log("Expired cases:",expired,"Processed deletion jobs:",removed,
      "Remaining:",pending.rows[0]?.count??0,"Overdue:",late.rows[0]?.count??0);
    if((late.rows[0]?.count??0)>0)throw Error("Overdue encrypted photo deletions require immediate review.");
  } finally {
    await pool.end();
  }
}
