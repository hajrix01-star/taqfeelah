#!/usr/bin/env node
/**
 * Migrate inline attachment rows (inline:v1:* / data:*) to local:v1 disk files
 * before cleanup-inline-attachments deletes them.
 *
 * Dry-run by default. Pass --apply to update rows.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const LOCAL_PREFIX = "local:v1:";

const connectionString = process.env.DATABASE_URL
  || "postgresql://postgres:123456@localhost:5432/taqfeelah_local";

const storageRoot = (process.env.ATTACHMENT_STORAGE_ROOT || "/var/lib/taqfeelah/attachments").trim();
const apply = process.argv.includes("--apply");

function resolveInlineDataUrl(storageKey) {
  if (!storageKey) return "";
  if (storageKey.startsWith("data:")) return storageKey;
  if (!storageKey.startsWith("inline:v1:")) return "";
  const payloadStart = storageKey.indexOf(":data:");
  if (payloadStart === -1) return "";
  return storageKey.slice(payloadStart + 1);
}

function parseDataUrl(dataUrl) {
  if (!dataUrl.startsWith("data:")) {
    throw new Error("Invalid data URL.");
  }
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) throw new Error("Invalid data URL.");
  const header = dataUrl.slice(5, commaIndex);
  const mimeType = header.replace(/;base64$/i, "");
  const base64Payload = dataUrl.slice(commaIndex + 1);
  return { mimeType, base64Payload };
}

function extensionForMime(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function buildLocalStorageKey(organizationId, storeId, checksum, extension) {
  return `${LOCAL_PREFIX}${organizationId}/${storeId}/${checksum}.${extension}`;
}

const client = new pg.Client({ connectionString });
await client.connect();

const { rows } = await client.query(
  `
  select
    id,
    organization_id,
    store_id,
    storage_key,
    original_file_name,
    mime_type,
    size_bytes
  from attachments
  where storage_key like 'inline:v1:%' or storage_key like 'data:%'
  order by created_at asc
  `,
);

console.log(`Inline attachment migration (${apply ? "apply" : "dry-run"})`);
console.log(`  storage root: ${storageRoot}`);
console.log(`  candidates: ${rows.length}`);

let migrated = 0;
let skipped = 0;

for (const row of rows) {
  const dataUrl = resolveInlineDataUrl(row.storage_key);
  if (!dataUrl) {
    skipped += 1;
    console.log(`  skip ${row.id}: cannot resolve inline payload`);
    continue;
  }

  let parsed;
  try {
    parsed = parseDataUrl(dataUrl);
  } catch (error) {
    skipped += 1;
    console.log(`  skip ${row.id}: ${error.message}`);
    continue;
  }

  const checksum = createHash("sha256").update(dataUrl).digest("hex").slice(0, 24);
  const extension = extensionForMime(parsed.mimeType);
  const storageKey = buildLocalStorageKey(row.organization_id, row.store_id, checksum, extension);
  const relativePath = storageKey.slice(LOCAL_PREFIX.length);
  const absolutePath = path.resolve(storageRoot, relativePath);

  if (!apply) {
    console.log(`  would migrate ${row.id} -> ${storageKey}`);
    migrated += 1;
    continue;
  }

  await mkdir(path.dirname(absolutePath), { recursive: true });
  const binary = Buffer.from(parsed.base64Payload, "base64");
  if (!binary.length) {
    skipped += 1;
    console.log(`  skip ${row.id}: empty payload`);
    continue;
  }

  try {
    await writeFile(absolutePath, binary, { flag: "wx" });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }

  await client.query(
    `
    update attachments
    set storage_key = $1
    where id = $2
    `,
    [storageKey, row.id],
  );
  migrated += 1;
  console.log(`  migrated ${row.id} -> ${storageKey}`);
}

console.log(`  migrated: ${migrated}`);
console.log(`  skipped: ${skipped}`);

await client.end();

if (!apply && rows.length > 0) {
  console.log("\nDry run only. Re-run with --apply to persist local files and update rows.");
}
