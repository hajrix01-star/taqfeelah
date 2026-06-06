#!/usr/bin/env node
/**
 * Print which database and owner auth source production is using.
 *
 * Usage on VPS:
 *   cd /opt/taqfeelah
 *   set -a && source .env.production && set +a
 *   node scripts/diagnose-owner-auth.mjs
 */

import process from "node:process";
import { Client } from "pg";

function valueFromEnv(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function databaseHost(databaseUrl) {
  try {
    return new URL(databaseUrl).host;
  } catch {
    return "<unparsed>";
  }
}

const organizationId = valueFromEnv(
  "AUTH_ORGANIZATION_ID",
  valueFromEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1"),
);

async function main() {
  const databaseUrl = valueFromEnv("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  console.log("DATABASE host:", databaseHost(databaseUrl));
  console.log("AUTH_OWNER_USERNAME in env:", valueFromEnv("AUTH_OWNER_USERNAME", "<missing>"));
  console.log("AUTH_OWNER_PASSWORD in env:", valueFromEnv("AUTH_OWNER_PASSWORD") ? "<set>" : "<missing>");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const rows = await client.query(
      `
      select created_at, reason, metadata->'settings'->'authConfig' as auth_config
      from audit_events
      where organization_id = $1
        and action = 'runtime_settings_saved'
      order by created_at desc
      limit 3
      `,
      [organizationId],
    );

    console.log(`Latest runtime_settings_saved rows for org ${organizationId}:`);
    for (const row of rows.rows) {
      const auth = row.auth_config || {};
      console.log(
        `- ${row.created_at.toISOString()} reason=${row.reason || "<none>"} username=${auth.ownerUsername || "<none>"} password=${auth.ownerPassword ? "<set>" : "<none>"}`,
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
