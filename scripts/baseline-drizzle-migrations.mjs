#!/usr/bin/env node
/**
 * Mark drizzle journal migrations as applied when schema was created via db:push.
 * Safe no-op when __drizzle_migrations already has rows or daily_closeouts is missing.
 */
import pg from "pg";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { fileURLToPath } from "node:url";
import path from "node:path";

const connectionString = process.env.DATABASE_URL
  || "postgresql://postgres:123456@localhost:5432/taqfeelah_local";

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "drizzle");
const migrations = readMigrationFiles({ migrationsFolder });

const client = new pg.Client({ connectionString });
await client.connect();

try {
  const { rows: closeoutTable } = await client.query(`
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'daily_closeouts'
    limit 1
  `);

  if (!closeoutTable.length) {
    console.log("daily_closeouts not found — run db:push or db:migrate on a fresh database first.");
    process.exit(1);
  }

  await client.query(`create schema if not exists drizzle`);
  await client.query(`
    create table if not exists drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `);

  const { rows: applied } = await client.query(`
    select hash from drizzle.__drizzle_migrations order by created_at
  `);
  const appliedHashes = new Set(applied.map((row) => row.hash));

  let inserted = 0;
  for (const migration of migrations) {
    if (appliedHashes.has(migration.hash)) continue;
    await client.query(
      `insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)`,
      [migration.hash, migration.folderMillis],
    );
    inserted += 1;
    console.log(`Marked applied: ${migration.hash.slice(0, 12)}…`);
  }

  if (!inserted) {
    console.log(`Already baselined (${applied.length} migration row(s)).`);
  } else {
    console.log(`Baselined ${inserted} migration(s).`);
  }
} finally {
  await client.end();
}
