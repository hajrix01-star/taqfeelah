import pg from "pg";

const connectionString = process.env.DATABASE_URL
  || "postgresql://postgres:123456@localhost:5432/taqfeelah_local";

const client = new pg.Client({ connectionString });
await client.connect();

const tables = await client.query(`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
    and table_name in ('daily_closeouts', 'entries', 'audit_events')
  order by 1
`);

const closeoutCol = await client.query(`
  select column_name, is_nullable
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'entries'
    and column_name = 'closeout_id'
`);

const closeoutSample = await client.query(`
  select id, date, day_sequence, status, client_closeout_id
  from daily_closeouts
  order by date desc, day_sequence desc
  limit 5
`);

const entryLink = await client.query(`
  select
    count(*)::int as total,
    count(closeout_id)::int as linked,
    count(*) filter (where closeout_id is null)::int as unlinked,
    count(*) filter (where closeout_id is null and status = 'active')::int as active_orphans,
    count(*) filter (where closeout_id is null and status = 'voided')::int as voided_orphans,
    count(*) filter (where type = 'summary' and closeout_id is null)::int as summary_unlinked
  from entries
`);

const returnedRow = await client.query(`
  select status, return_reason, client_closeout_id
  from daily_closeouts
  where status = 'returned'
  limit 1
`);

const migrations = await client.query(`
  select id, hash, created_at
  from drizzle.__drizzle_migrations
  order by created_at
`).catch(() => ({ rows: [] }));

const report = {
  tables: tables.rows.map((r) => r.table_name),
  entriesHasCloseoutId: closeoutCol.rows.length > 0,
  entriesCloseoutIdNotNull: closeoutCol.rows[0]?.is_nullable === "NO",
  closeoutSample: closeoutSample.rows,
  entryLink: entryLink.rows[0],
  returnedSample: returnedRow.rows[0] || null,
  drizzleMigrations: migrations.rows,
};

console.log(JSON.stringify(report, null, 2));

const failures = [];
const tableNames = new Set(report.tables);
for (const required of ["daily_closeouts", "entries"]) {
  if (!tableNames.has(required)) failures.push(`missing table: ${required}`);
}
if (!report.entriesHasCloseoutId) failures.push("entries.closeout_id column missing");
if (!report.entriesCloseoutIdNotNull) failures.push("entries.closeout_id is not NOT NULL");
if ((report.entryLink?.unlinked ?? 0) > 0) {
  failures.push(`entries.unlinked=${report.entryLink.unlinked} (expected 0)`);
}
if ((report.entryLink?.active_orphans ?? 0) > 0) {
  failures.push(`entries.active_orphans=${report.entryLink.active_orphans} (expected 0)`);
}
const schemaBaselined =
  report.entriesHasCloseoutId &&
  report.entriesCloseoutIdNotNull &&
  tableNames.has("daily_closeouts") &&
  tableNames.has("entries");
if (report.drizzleMigrations.length < 3 && !schemaBaselined) {
  failures.push(
    `drizzle migrations=${report.drizzleMigrations.length} (expected >= 3 or closeout-linked schema)`,
  );
}

await client.end();

if (failures.length > 0) {
  console.error("\n❌ verify-plan-table-db failed:");
  for (const message of failures) console.error(`  - ${message}`);
  process.exit(1);
}

console.log("\n✅ verify-plan-table-db passed.");
