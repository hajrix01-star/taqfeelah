import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { requireDatabaseUrl } from "@/core/config/env";

const globalDb = globalThis as unknown as {
  pool?: Pool;
  db?: ReturnType<typeof drizzle>;
};

export function getDb() {
  if (globalDb.db) return globalDb.db;

  const pool = new Pool({
    connectionString: requireDatabaseUrl(),
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2_000,
  });

  const db = drizzle(pool);
  globalDb.pool = pool;
  globalDb.db = db;
  return db;
}
