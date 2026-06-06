#!/usr/bin/env node
/**
 * Reset production owner login credentials.
 *
 * 1) Writes AUTH_OWNER_USERNAME/PASSWORD into the latest runtime settings row.
 * 2) Inserts a fresh runtime_settings_saved row so it becomes the active source.
 *
 * Usage on VPS (uses the SAME DATABASE_URL as the running app):
 *   cd /opt/taqfeelah
 *   set -a && source .env.production && set +a
 *   AUTH_OWNER_USERNAME=hajri AUTH_OWNER_PASSWORD=123 node scripts/reset-owner-auth.mjs
 *   pm2 restart taqfeelah-app
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
  valueFromEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", "8f63cf87-f2e2-4e2a-a20e-8f637f0a9e1"),
);
const ownerUserId = valueFromEnv(
  "AUTH_OWNER_USER_ID",
  valueFromEnv("NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID", "e8f3e35b-6051-4da3-8b10-979700c2f00f"),
);
const ownerUsername = valueFromEnv("AUTH_OWNER_USERNAME", "hajri").toLowerCase();
const ownerPassword = valueFromEnv("AUTH_OWNER_PASSWORD", "123");

async function main() {
  const databaseUrl = valueFromEnv("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Run: set -a && source .env.production && set +a");
  }
  if (!ownerUsername || !ownerPassword) {
    throw new Error("AUTH_OWNER_USERNAME and AUTH_OWNER_PASSWORD are required.");
  }

  console.log("Connecting to database host:", databaseHost(databaseUrl));
  console.log("Organization:", organizationId);

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const current = await client.query(
      `
      select id, created_at, metadata
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
    const envelope = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
    const settings = envelope.settings && typeof envelope.settings === "object" ? { ...envelope.settings } : {};
    const previousAuth = settings.authConfig && typeof settings.authConfig === "object" ? settings.authConfig : {};

    console.log("Previous ownerUsername:", previousAuth.ownerUsername || "<none>");
    console.log("Previous ownerPassword:", previousAuth.ownerPassword ? "<set>" : "<none>");

    const nextSettings = {
      ...settings,
      authConfig: {
        ...previousAuth,
        ownerUsername,
        ownerPassword,
      },
    };

    await client.query(
      `
      insert into audit_events (
        organization_id,
        store_id,
        entry_id,
        actor_user_id,
        action,
        reason,
        metadata
      )
      values ($1, null, null, $2, 'runtime_settings_saved', 'reset_owner_auth', $3::jsonb)
      `,
      [organizationId, ownerUserId, JSON.stringify({ settings: nextSettings, schemaVersion: 1 })],
    );

    console.log("Inserted new runtime settings row with owner auth reset.");
    console.log("New ownerUsername:", ownerUsername);
    console.log("New ownerPassword: <set>");
    console.log("");
    console.log("Next steps on VPS:");
    console.log("1) Ensure /opt/taqfeelah/.env.production contains:");
    console.log(`   AUTH_OWNER_USERNAME=${ownerUsername}`);
    console.log(`   AUTH_OWNER_PASSWORD=${ownerPassword}`);
    console.log("2) Restart app: pm2 restart taqfeelah-app");
    console.log("3) Login at https://www.taqfeelah.com");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
