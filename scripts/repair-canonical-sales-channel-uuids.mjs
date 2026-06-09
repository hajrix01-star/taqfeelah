#!/usr/bin/env node
/**
 * Migrate sales_channels rows that use non-RFC4122 UUID variants (accepted by Postgres
 * but rejected by client isUuid) to the canonical catalog UUIDs.
 */

import process from "node:process";
import { Client } from "pg";
import { DEFAULT_SALES_CHANNEL_UUIDS } from "../src/core/client/sales-channel-catalog.ts";
import { isUuid } from "../src/core/client/api-id-utils.js";

/** Invalid UUIDs previously seeded via .env / vps_deploy defaults. */
const INVALID_TO_CANONICAL = {
  "9e5c3a4b-0d6f-4a1c-c3e4-5f6a7b8c9d0e": DEFAULT_SALES_CHANNEL_UUIDS.jahez,
  "af6d4b5c-1e7a-4b2d-d4f5-6a7b8c9d0e1f": DEFAULT_SALES_CHANNEL_UUIDS.hunger,
};

async function migrateChannelId(client, fromId, toId) {
  if (fromId === toId) return false;
  if (!isUuid(toId)) {
    console.warn(`Skipped ${fromId}: canonical target is not RFC4122-valid (${toId})`);
    return false;
  }

  const { rows } = await client.query(
    `SELECT id, organization_id, store_id, name, status, retired_at
     FROM sales_channels
     WHERE id = $1`,
    [fromId],
  );
  if (rows.length === 0) return false;

  const row = rows[0];
  const { rows: targetRows } = await client.query(
    `SELECT id FROM sales_channels WHERE id = $1`,
    [toId],
  );

  if (targetRows.length === 0) {
    await client.query(
      `INSERT INTO sales_channels (id, organization_id, store_id, name, status, retired_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [toId, row.organization_id, row.store_id, row.name, row.status, row.retired_at],
    );
    console.log(`Inserted canonical sales channel ${toId} (${row.name})`);
  }

  const { rowCount: entryUpdates } = await client.query(
    `UPDATE entry_sales_channels
     SET sales_channel_id = $2
     WHERE sales_channel_id = $1`,
    [fromId, toId],
  );
  if (entryUpdates > 0) {
    console.log(`Updated ${entryUpdates} entry_sales_channels row(s): ${fromId} -> ${toId}`);
  }

  await client.query(`DELETE FROM sales_channels WHERE id = $1`, [fromId]);
  console.log(`Removed invalid sales channel ${fromId} -> ${toId}`);
  return true;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  for (const [legacyId, uuid] of Object.entries(DEFAULT_SALES_CHANNEL_UUIDS)) {
    if (!isUuid(uuid)) {
      console.error(`Catalog UUID for ${legacyId} is not RFC4122-valid: ${uuid}`);
      process.exit(1);
    }
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("begin");
    let migrated = 0;
    for (const [fromId, toId] of Object.entries(INVALID_TO_CANONICAL)) {
      if (await migrateChannelId(client, fromId, toId)) migrated += 1;
    }
    await client.query("commit");
    console.log(`Done. Migrated ${migrated} invalid sales channel id(s).`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
