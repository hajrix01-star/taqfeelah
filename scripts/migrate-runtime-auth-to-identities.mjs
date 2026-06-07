#!/usr/bin/env node
/**
 * One-time migration: runtime settings authConfig → auth_identities.
 * Run before enabling AUTH_DB_CREDENTIALS_ENABLED on an existing VPS.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/migrate-runtime-auth-to-identities.mjs
 */

import process from "node:process";
import { Client } from "pg";
import { hashPassword } from "./lib/password-hash.mjs";

function valueFromEnv(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

const organizationId = valueFromEnv(
  "AUTH_ORGANIZATION_ID",
  valueFromEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1"),
);
const ownerUserId = valueFromEnv(
  "AUTH_OWNER_USER_ID",
  valueFromEnv("NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID", "e8f3e35b-6051-4da3-8b10-979700c2f00f"),
);

async function loadLatestAuthConfig(client) {
  const result = await client.query(
    `
    select metadata->'settings'->'authConfig' as auth_config,
           metadata->'settings'->'staff' as staff
    from audit_events
    where organization_id = $1
      and action = 'runtime_settings_saved'
    order by created_at desc
    limit 1
    `,
    [organizationId],
  );
  const row = result.rows[0];
  if (!row?.auth_config) {
    throw new Error("No runtime_settings_saved authConfig found for organization.");
  }
  return {
    authConfig: row.auth_config,
    staff: Array.isArray(row.staff) ? row.staff : [],
  };
}

async function upsertOwnerIdentity(client, { userId, username, password }) {
  const passwordHash = await hashPassword(password);
  const normalizedUsername = String(username).trim().toLowerCase();
  await client.query(
    `
    insert into auth_identities (user_id, provider, username, password_hash, status)
    values ($1, 'username_password', $2, $3, 'active')
    on conflict do nothing
    `,
    [userId, normalizedUsername, passwordHash],
  );

  const existing = await client.query(
    `
    select id from auth_identities
    where user_id = $1 and provider = 'username_password'
    limit 1
    `,
    [userId],
  );
  if (existing.rows[0]?.id) {
    await client.query(
      `
      update auth_identities
      set username = $2, password_hash = $3, status = 'active', updated_at = now()
      where id = $1
      `,
      [existing.rows[0].id, normalizedUsername, passwordHash],
    );
  }
}

async function upsertEmployeeIdentity(client, { userId, pin }) {
  const passwordHash = await hashPassword(pin);
  const existing = await client.query(
    `
    select id from auth_identities
    where user_id = $1 and provider = 'employee_pin'
    limit 1
    `,
    [userId],
  );
  if (existing.rows[0]?.id) {
    await client.query(
      `
      update auth_identities
      set password_hash = $2, status = 'active', updated_at = now()
      where id = $1
      `,
      [existing.rows[0].id, passwordHash],
    );
    return;
  }
  await client.query(
    `
    insert into auth_identities (user_id, provider, password_hash, status)
    values ($1, 'employee_pin', $2, 'active')
    `,
    [userId, passwordHash],
  );
}

function resolveEmployeeUserId(staffRow, employeePins, legacyId) {
  if (staffRow?.apiUserId && typeof staffRow.apiUserId === "string") {
    return staffRow.apiUserId;
  }
  const userIdMapRaw = valueFromEnv("NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP");
  if (userIdMapRaw) {
    try {
      const map = JSON.parse(userIdMapRaw);
      if (map?.[legacyId]) return map[legacyId];
    } catch {
      // ignore invalid map
    }
  }
  return null;
}

async function main() {
  const databaseUrl = valueFromEnv("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const { authConfig, staff } = await loadLatestAuthConfig(client);
    const ownerUsername = authConfig.ownerUsername || valueFromEnv("AUTH_OWNER_USERNAME", "hajri");
    const ownerPassword = authConfig.ownerPassword || valueFromEnv("AUTH_OWNER_PASSWORD", "123");
    const employeePins = authConfig.employeePins && typeof authConfig.employeePins === "object"
      ? authConfig.employeePins
      : {};

    await client.query("begin");

    await upsertOwnerIdentity(client, {
      userId: ownerUserId,
      username: ownerUsername,
      password: ownerPassword,
    });
    console.log(`Migrated owner credentials (username=${ownerUsername}).`);

    for (const person of staff) {
      const legacyId = person?.id;
      const pin = legacyId ? employeePins[legacyId] : null;
      if (!legacyId || !pin) continue;
      const userId = resolveEmployeeUserId(person, employeePins, legacyId);
      if (!userId) {
        console.warn(`Skipped employee ${legacyId}: no apiUserId mapping.`);
        continue;
      }
      await upsertEmployeeIdentity(client, { userId, pin: String(pin) });
      console.log(`Migrated employee pin for ${legacyId} → user ${userId}.`);
    }

    await client.query("commit");
    console.log("Runtime auth migration to auth_identities completed.");
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
