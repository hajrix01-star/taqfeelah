#!/usr/bin/env node
/**
 * Report attachment row health: storage_key format, inline payload presence,
 * and on-disk file availability for local:v1 keys.
 *
 * Usage:
 *   node scripts/diagnose-attachments.mjs
 *   node scripts/diagnose-attachments.mjs --org=<uuid> --store=<uuid>
 */
import { access } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const LOCAL_PREFIX = "local:v1:";
const INLINE_PREFIX = "inline:v1:";

const connectionString = process.env.DATABASE_URL
  || "postgresql://postgres:123456@localhost:5432/taqfeelah_local";

const storageRoot = (process.env.ATTACHMENT_STORAGE_ROOT || "/var/lib/taqfeelah/attachments").trim();

function parseArgs(argv) {
  let orgId = null;
  let storeId = null;
  for (const arg of argv) {
    if (arg.startsWith("--org=")) orgId = arg.slice(6).trim() || null;
    if (arg.startsWith("--store=")) storeId = arg.slice(8).trim() || null;
  }
  return { orgId, storeId };
}

function classifyKey(storageKey) {
  if (!storageKey) return "missing";
  if (storageKey.startsWith(LOCAL_PREFIX)) return "local_v1";
  if (storageKey.startsWith(INLINE_PREFIX)) return "inline_v1";
  if (storageKey.startsWith("data:")) return "legacy_data_url";
  return "other";
}

function localRelativePath(storageKey) {
  if (!storageKey.startsWith(LOCAL_PREFIX)) return "";
  return storageKey.slice(LOCAL_PREFIX.length);
}

async function fileExists(absolutePath) {
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

const { orgId, storeId } = parseArgs(process.argv.slice(2));
const client = new pg.Client({ connectionString });
await client.connect();

const filters = [];
const params = [];
let index = 1;
if (orgId) {
  filters.push(`organization_id = $${index}`);
  params.push(orgId);
  index += 1;
}
if (storeId) {
  filters.push(`store_id = $${index}`);
  params.push(storeId);
  index += 1;
}
const whereSql = filters.length ? `where ${filters.join(" and ")}` : "";

const { rows: summaryRows } = await client.query(
  `
  select
    case
      when storage_key like 'local:v1:%' then 'local_v1'
      when storage_key like 'inline:v1:%' then 'inline_v1'
      when storage_key like 'data:%' then 'legacy_data_url'
      else 'other'
    end as key_format,
    count(*)::int as row_count
  from attachments
  ${whereSql}
  group by 1
  order by 2 desc
  `,
  params,
);

const { rows: attachmentRows } = await client.query(
  `
  select
    id,
    organization_id,
    store_id,
    entry_id,
    storage_key,
    mime_type,
    size_bytes,
    created_at
  from attachments
  ${whereSql}
  order by created_at desc
  `,
  params,
);

console.log("Attachment diagnostics");
console.log(`  storage root: ${storageRoot}`);
if (orgId) console.log(`  organization filter: ${orgId}`);
if (storeId) console.log(`  store filter: ${storeId}`);
console.log(`  total rows: ${attachmentRows.length}`);

summaryRows.forEach((row) => {
  console.log(`  - ${row.key_format}: ${row.row_count}`);
});

let missingLocalFiles = 0;
let inlineRows = 0;
let legacyInlineBytes = 0;

for (const row of attachmentRows) {
  const format = classifyKey(row.storage_key);
  if (format === "inline_v1" || format === "legacy_data_url") {
    inlineRows += 1;
    legacyInlineBytes += Number(row.storage_key?.length || 0);
    continue;
  }
  if (format !== "local_v1") continue;

  const relativePath = localRelativePath(row.storage_key);
  const absolutePath = path.resolve(storageRoot, relativePath);
  const exists = await fileExists(absolutePath);
  if (!exists) {
    missingLocalFiles += 1;
    if (missingLocalFiles <= 15) {
      console.log(
        `  MISSING FILE: ${row.id} entry=${row.entry_id} `
        + `expected=${absolutePath}`,
      );
    }
  }
}

if (missingLocalFiles > 15) {
  console.log(`  ... and ${missingLocalFiles - 15} more missing local files`);
}

console.log(`  inline rows still in DB: ${inlineRows}`);
console.log(`  inline payload bytes in storage_key: ${legacyInlineBytes}`);
console.log(`  local:v1 rows with missing files: ${missingLocalFiles}`);

if (missingLocalFiles > 0) {
  console.log(
    "\nLikely cause: attachment files were stored under /opt/taqfeelah/data/attachments "
    + "and deleted by deploy wipe (rm -rf /opt/taqfeelah/*). "
    + "New deploys persist files under /var/lib/taqfeelah/attachments.",
  );
}

await client.end();

if (missingLocalFiles > 0 || inlineRows > 0) {
  process.exitCode = 2;
}
