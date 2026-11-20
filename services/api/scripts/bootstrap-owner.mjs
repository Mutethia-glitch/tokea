import { pool } from "../src/db.js";
const email=process.argv.slice(2).find(a=>a.includes("@"))?.trim().toLowerCase();
if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Usage: bun scripts/bootstrap-owner.mjs YOUR_VERIFIED_GOOGLE_EMAIL");
  process.exit(1);
}
const db=await pool.connect();
try{
  await db.query("BEGIN");
  const current=await db.query("SELECT 1 FROM admin_memberships WHERE role='owner'");
  if(current.rowCount)throw Error("An owner already exists. Use existing owner's invitations for more staff.");
  const user=await db.query("INSERT INTO users(display_name) VALUES('Tokea owner') RETURNING id");
  await db.query("INSERT INTO staff_google_identities(email,user_id) VALUES($1,$2)",
    [email,user.rows[0].id]);
  await db.query("INSERT INTO admin_memberships(user_id,role) VALUES($1,'owner')",[user.rows[0].id]);
  await db.query("COMMIT");
  console.log("Owner email prepared. Sign in using Google with the same email.");
}catch(e){await db.query("ROLLBACK");console.error(e instanceof Error?e.message:e);process.exitCode=1;}
finally{db.release();await pool.end();}
