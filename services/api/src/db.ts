import pg from "pg";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be configured before starting the Tokea API.");
}
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 12 });
