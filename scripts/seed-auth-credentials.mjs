#!/usr/bin/env node
/**
 * Seed auth_identities for Phase 10 activation prep.
 * Does NOT flip runtime flags — only writes hashed credentials to PostgreSQL.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/seed-auth-credentials.mjs
 *
 * Optional env:
 *   SEED_OWNER_USER_ID, AUTH_OWNER_USERNAME, AUTH_OWNER_PASSWORD
 *   SEED_EMPLOYEE_PIN_MAP — JSON: { "<user-uuid>": "<pin>", ... }
 */

import process from "node:process";
import { Client } from "pg";
import { hashPassword } from "./lib/password-hash.mjs";

function valueFromEnv(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

const DEFAULT_OWNER_USER_ID = "e8f3e35b-6051-4da3-8b10-979700c2f00f";
const DEFAULT_EMPLOYEE_PINS = {
  "4cf1450d-08d8-4ca1-b180-1c2642174a79": "1234",
  "85f696d6-f655-4f2d-9f56-1f13c2f4c66c": "1234",
};

function parseEmployeePinMap() {
  const raw = valueFromEnv("SEED_EMPLOYEE_PIN_MAP");
  if (raw) {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("SEED_EMPLOYEE_PIN_MAP must be a JSON object.");
    }
    return parsed;
  }
  return DEFAULT_EMPLOYEE_PINS;
}

async function upsertOwnerIdentity(client, { userId, username, password }) {
  const passwordHash = await hashPassword(password);
  const normalizedUsername = username.trim().toLowerCase();
  const [existing] = (
    await client.query(
      `
      select id from auth_identities
      where user_id = $1 and provider = 'username_password'
      limit 1
      `,
      [userId],
    )
  ).rows;

  if (existing?.id) {
    await client.query(
      `
      update auth_identities
      set username = $2, password_hash = $3, status = 'active', updated_at = now()
      where id = $1
      `,
      [existing.id, normalizedUsername, passwordHash],
    );
    console.log(`Updated owner identity for user ${userId} (username=${normalizedUsername}).`);
    return;
  }

  await client.query(
    `
    insert into auth_identities (user_id, provider, username, password_hash, status)
    values ($1, 'username_password', $2, $3, 'active')
    `,
    [userId, normalizedUsername, passwordHash],
  );
  console.log(`Created owner identity for user ${userId} (username=${normalizedUsername}).`);
}

async function upsertEmployeeIdentity(client, { userId, pin }) {
  const passwordHash = await hashPassword(pin);
  const [existing] = (
    await client.query(
      `
      select id from auth_identities
      where user_id = $1 and provider = 'employee_pin'
      limit 1
      `,
      [userId],
    )
  ).rows;

  if (existing?.id) {
    await client.query(
      `
      update auth_identities
      set password_hash = $2, status = 'active', updated_at = now()
      where id = $1
      `,
      [existing.id, passwordHash],
    );
    console.log(`Updated employee pin identity for user ${userId}.`);
    return;
  }

  await client.query(
    `
    insert into auth_identities (user_id, provider, password_hash, status)
    values ($1, 'employee_pin', $2, 'active')
    `,
    [userId, passwordHash],
  );
  console.log(`Created employee pin identity for user ${userId}.`);
}

async function main() {
  const databaseUrl = valueFromEnv("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const ownerUserId = valueFromEnv("SEED_OWNER_USER_ID", valueFromEnv("AUTH_OWNER_USER_ID", DEFAULT_OWNER_USER_ID));
  const ownerUsername = valueFromEnv("AUTH_OWNER_USERNAME", "hajri");
  const ownerPassword = valueFromEnv("AUTH_OWNER_PASSWORD", "123");
  const employeePins = parseEmployeePinMap();

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("begin");
    await upsertOwnerIdentity(client, {
      userId: ownerUserId,
      username: ownerUsername,
      password: ownerPassword,
    });

    for (const [userId, pin] of Object.entries(employeePins)) {
      if (!userId || !pin) continue;
      await upsertEmployeeIdentity(client, { userId, pin: String(pin) });
    }

    await client.query("commit");
    console.log("Auth credentials seed completed.");
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
