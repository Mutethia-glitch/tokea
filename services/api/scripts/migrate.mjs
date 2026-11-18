import { readdir, readFile } from "node:fs/promises";
import pg from "pg";
if (!process.env.DATABASE_URL) throw Error("DATABASE_URL is required for local migrations.");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const dir = new URL("../db/", import.meta.url);
try {
  await db.connect();
  const migrations=(await readdir(dir)).filter(f=>/^\d+_.*\.sql$/.test(f)).sort();
  for(const file of migrations) {
    const sql=await readFile(new URL(file,dir),"utf8");
    await db.query(sql); // additive, idempotent schema files; no external services.
    console.log("Applied",file);
  }
} finally { await db.end(); }
