#!/usr/bin/env node
/**
 * Delete prototype inline attachments (experimental image bytes embedded in storage_key).
 * Dry-run by default. Pass --apply to delete rows permanently.
 *
 * Targets:
 *   - inline:v1:*  (normalized inline keys)
 *   - data:*       (legacy raw data URLs)
 *
 * Optional filters:
 *   --org=<uuid>
 *   --store=<uuid>
 *   --before=<ISO date or YYYY-MM-DD>
 *   --vacuum       run VACUUM ANALYZE attachments after delete (apply mode only)
 */
import pg from "pg";

const { apply, vacuum, orgId, storeId, before } = parseArgs(process.argv.slice(2));

const connectionString = process.env.DATABASE_URL
  || "postgresql://postgres:123456@localhost:5432/taqfeelah_local";

const client = new pg.Client({ connectionString });

function parseArgs(argv) {
  const applyFlag = argv.includes("--apply");
  const vacuumFlag = argv.includes("--vacuum");
  let parsedOrgId = null;
  let parsedStoreId = null;
  let parsedBefore = null;

  for (const arg of argv) {
    if (arg.startsWith("--org=")) parsedOrgId = arg.slice(6).trim() || null;
    if (arg.startsWith("--store=")) parsedStoreId = arg.slice(8).trim() || null;
    if (arg.startsWith("--before=")) parsedBefore = arg.slice(9).trim() || null;
  }

  return {
    apply: applyFlag,
    vacuum: vacuumFlag,
    orgId: parsedOrgId,
    storeId: parsedStoreId,
    before: parsedBefore,
  };
}

function buildFilters(startIndex = 1) {
  const conditions = [
    "(storage_key like 'inline:v1:%' or storage_key like 'data:%')",
  ];
  const params = [];
  let index = startIndex;

  if (orgId) {
    conditions.push(`organization_id = $${index}`);
    params.push(orgId);
    index += 1;
  }
  if (storeId) {
    conditions.push(`store_id = $${index}`);
    params.push(storeId);
    index += 1;
  }
  if (before) {
    conditions.push(`created_at < $${index}::timestamptz`);
    params.push(before);
    index += 1;
  }

  return {
    whereSql: conditions.join("\n    and "),
    params,
    nextIndex: index,
  };
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

await client.connect();

const { whereSql, params } = buildFilters();

const inventory = await client.query(
  `
  select
    case
      when storage_key like 'inline:v1:%' then 'inline:v1'
      when storage_key like 'data:%' then 'legacy_data_url'
      else 'other'
    end as key_format,
    count(*)::int as row_count,
    coalesce(sum(length(storage_key)), 0)::bigint as storage_key_bytes,
    coalesce(sum(size_bytes), 0)::bigint as declared_size_bytes,
    min(created_at) as oldest,
    max(created_at) as newest
  from attachments
  where ${whereSql}
  group by 1
  order by 2 desc
  `,
  params,
);

const totalRows = inventory.rows.reduce((sum, row) => sum + row.row_count, 0);
const totalStorageKeyBytes = inventory.rows.reduce(
  (sum, row) => sum + Number(row.storage_key_bytes || 0),
  0,
);

console.log("Inline attachment cleanup inventory");
if (orgId) console.log(`  organization filter: ${orgId}`);
if (storeId) console.log(`  store filter: ${storeId}`);
if (before) console.log(`  created before: ${before}`);
console.log(`  matching rows: ${totalRows}`);
console.log(`  embedded payload size (storage_key bytes): ${formatBytes(totalStorageKeyBytes)}`);

inventory.rows.forEach((row) => {
  console.log(
    `  - ${row.key_format}: ${row.row_count} rows, `
    + `${formatBytes(Number(row.storage_key_bytes))}, `
    + `oldest=${row.oldest?.toISOString?.() || row.oldest}, `
    + `newest=${row.newest?.toISOString?.() || row.newest}`,
  );
});

if (!totalRows) {
  console.log("\nNothing to delete.");
  await client.end();
  process.exit(0);
}

const { rows: samples } = await client.query(
  `
  select
    id,
    organization_id,
    store_id,
    entry_id,
    left(storage_key, 48) as storage_key_prefix,
    length(storage_key)::int as storage_key_length,
    mime_type,
    size_bytes,
    created_at
  from attachments
  where ${whereSql}
  order by created_at desc
  limit 10
  `,
  params,
);

console.log("\nSample rows (newest first):");
samples.forEach((row) => {
  console.log(
    `  - ${row.id} org=${row.organization_id} store=${row.store_id} `
    + `entry=${row.entry_id} key=${row.storage_key_prefix}… `
    + `(${formatBytes(row.storage_key_length)})`,
  );
});

if (!apply) {
  console.log("\nDry run only. Re-run with --apply to delete inline attachment rows.");
  await client.end();
  process.exit(0);
}

const deleteResult = await client.query(
  `
  delete from attachments
  where ${whereSql}
  returning id
  `,
  params,
);

console.log(`\nDeleted ${deleteResult.rowCount} inline attachment row(s).`);

if (vacuum) {
  console.log("Running VACUUM ANALYZE attachments…");
  await client.query("vacuum analyze attachments");
  console.log("VACUUM ANALYZE complete.");
}

await client.end();
