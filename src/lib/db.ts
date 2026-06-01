import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

export async function ensureUsersTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      role        TEXT NOT NULL CHECK (role IN ('client', 'advisor', 'admin')),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}
