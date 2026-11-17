import { readFile } from "node:fs/promises";
import pg from "pg";

if (!process.env.DATABASE_URL) throw Error("DATABASE_URL is required for migrations.");
const connection = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await connection.connect();
  const migration = await readFile(new URL("../db/0001_initial.sql", import.meta.url), "utf8");
  await connection.query(migration);
  console.log("Tokea PostgreSQL schema installed.");
} finally {
  await connection.end();
}
