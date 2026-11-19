import { readFile } from "node:fs/promises";
import pg from "pg";

if (!process.env.DATABASE_URL) throw Error("DATABASE_URL is required for migrations.");
const connection = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await connection.connect();
  for (const filename of ["0001_initial.sql", "0002_phone_otp.sql"]) {
    const migration = await readFile(new URL("../db/" + filename, import.meta.url), "utf8");
    await connection.query(migration);
  }
  console.log("Tokea PostgreSQL schema installed.");
} finally {
  await connection.end();
}
