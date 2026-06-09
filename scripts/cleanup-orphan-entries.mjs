#!/usr/bin/env node
/**
 * Remove legacy entries that have no closeout_id (pre–Phase-1 orphans).
 * Dry-run by default. Pass --apply to delete rows before NOT NULL migration.
 */
import pg from "pg";

const apply = process.argv.includes("--apply");
const connectionString = process.env.DATABASE_URL
  || "postgresql://postgres:123456@localhost:5432/taqfeelah_local";

const client = new pg.Client({ connectionString });

await client.connect();

const { rows: orphans } = await client.query(`
  select id, date, type, amount_halalas, status
  from entries
  where closeout_id is null
  order by date desc, created_at desc
`);

console.log(`Orphan entries (closeout_id IS NULL): ${orphans.length}`);
if (!orphans.length) {
  await client.end();
  process.exit(0);
}

orphans.slice(0, 20).forEach((row) => {
  console.log(`  - ${row.id} ${row.date} ${row.type} ${row.amount_halalas} halalas (${row.status})`);
});
if (orphans.length > 20) {
  console.log(`  ... and ${orphans.length - 20} more`);
}

if (!apply) {
  console.log("\nDry run only. Re-run with --apply to delete orphan entries.");
  await client.end();
  process.exit(0);
}

const result = await client.query(`
  delete from entries
  where closeout_id is null
  returning id
`);

console.log(`\nDeleted ${result.rowCount} orphan entries (closeout_id IS NULL).`);
await client.end();
