#!/usr/bin/env node
/**
 * Reset production owner login credentials stored in runtime settings (authConfig).
 *
 * Usage on VPS:
 *   cd /opt/taqfeelah
 *   set -a && source .env.production && set +a
 *   AUTH_OWNER_USERNAME=hajri AUTH_OWNER_PASSWORD=123 node scripts/reset-owner-auth.mjs
 */

import process from "node:process";
import { Client } from "pg";

function valueFromEnv(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

const organizationId = valueFromEnv(
  "AUTH_ORGANIZATION_ID",
  valueFromEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1"),
);
const ownerUsername = valueFromEnv("AUTH_OWNER_USERNAME", "hajri").toLowerCase();
const ownerPassword = valueFromEnv("AUTH_OWNER_PASSWORD", "123");

async function main() {
  const databaseUrl = valueFromEnv("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }
  if (!ownerUsername || !ownerPassword) {
    throw new Error("AUTH_OWNER_USERNAME and AUTH_OWNER_PASSWORD are required.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const current = await client.query(
      `
      select id, created_at, metadata->'settings'->'authConfig' as auth_config
      from audit_events
      where organization_id = $1
        and action = 'runtime_settings_saved'
      order by created_at desc
      limit 1
      `,
      [organizationId],
    );

    if (current.rowCount === 0) {
      throw new Error("No runtime_settings_saved row found. Run scripts/seed-closeouts-foundation.mjs first.");
    }

    const row = current.rows[0];
    const previous = row.auth_config || {};
    console.log("Previous ownerUsername:", previous.ownerUsername || "<none>");
    console.log("Previous ownerPassword:", previous.ownerPassword ? "<set>" : "<none>");

    const nextAuthConfig = {
      ...(typeof previous === "object" && previous ? previous : {}),
      ownerUsername,
      ownerPassword,
    };

    await client.query(
      `
      update audit_events
      set metadata = jsonb_set(
        metadata,
        '{settings,authConfig}',
        $2::jsonb,
        true
      )
      where id = $1
      `,
      [row.id, JSON.stringify(nextAuthConfig)],
    );

    console.log("Owner auth reset completed.");
    console.log("New ownerUsername:", ownerUsername);
    console.log("New ownerPassword: <set>");
    console.log("Try logging in at https://www.taqfeelah.com with these credentials.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
