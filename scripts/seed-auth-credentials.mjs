#!/usr/bin/env node
/**
 * Seed auth_identities for Phase 10 activation prep.
 * Does NOT flip runtime flags — only writes hashed credentials to PostgreSQL.
 *
 * Usage:
 *   DATABASE_URL=... node scripts/seed-auth-credentials.mjs
 *
 * Optional env:
 *   SEED_OWNER_USER_ID, AUTH_OWNER_USERNAME, AUTH_OWNER_PASSWORD,
 *   AUTH_OWNER_LOGIN_PHONE (Saudi E.164, for example +9665xxxxxxxx)
 *   SEED_EMPLOYEE_PIN_MAP — JSON: { "<user-uuid>": "<pin>", ... }
 *   SEED_EMPLOYEE_LOGIN_PHONE_MAP — JSON: { "<user-uuid>": "+9665xxxxxxxx", ... }
 *   AUTH_SEED_FORCE_OWNER_CREDENTIALS=true — overwrite existing owner username/password
 *     (requires explicit AUTH_OWNER_USERNAME and AUTH_OWNER_PASSWORD; used by recovery flows)
 *
 * Deploy behavior (wave 6+):
 *   - Missing owner identity → created with bootstrap defaults (or env when set)
 *   - Existing owner identity → preserved (username/password NOT overwritten)
 */

import process from "node:process";
import { Client } from "pg";
import { hashPassword } from "./lib/password-hash.mjs";
import {
  assertSafeAuthSeedEnv,
  canForceUpdateOwnerIdentity,
  isProductionScriptEnv,
  shouldPreserveExistingOwnerIdentity,
} from "./lib/auth-seed-policy.mjs";
import { normalizeOptionalLoginPhone } from "./lib/normalize-login-phone.mjs";

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
  if (isProductionScriptEnv()) {
    throw new Error("SEED_EMPLOYEE_PIN_MAP is required in production; default employee PINs are not allowed.");
  }
  return DEFAULT_EMPLOYEE_PINS;
}

function parseEmployeeLoginPhoneMap() {
  const raw = valueFromEnv("SEED_EMPLOYEE_LOGIN_PHONE_MAP");
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("SEED_EMPLOYEE_LOGIN_PHONE_MAP must be a JSON object.");
  }
  return Object.fromEntries(
    Object.entries(parsed).map(([userId, phone]) => [
      userId,
      normalizeOptionalLoginPhone(phone, `SEED_EMPLOYEE_LOGIN_PHONE_MAP[${userId}]`),
    ]),
  );
}

async function upsertOwnerIdentity(client, { userId, username, password, loginPhone }) {
  const passwordHash = await hashPassword(password);
  const normalizedUsername = username.trim().toLowerCase();
  const [existing] = (
    await client.query(
      `
      select id, username from auth_identities
      where user_id = $1 and provider = 'username_password'
      limit 1
      `,
      [userId],
    )
  ).rows;

  if (existing?.id) {
    if (shouldPreserveExistingOwnerIdentity()) {
      console.log(
        `Preserved existing owner identity for user ${userId} ` +
          `(username=${existing.username}; deploy seed does not overwrite).`,
      );
      return;
    }

    if (!canForceUpdateOwnerIdentity()) {
      console.log(
        `Skipped owner identity update for user ${userId}: ` +
          "set AUTH_SEED_FORCE_OWNER_CREDENTIALS=true with explicit AUTH_OWNER_USERNAME/PASSWORD.",
      );
      return;
    }

    await client.query(
      `
      update auth_identities
      set username = $2, password_hash = $3,
          login_phone = coalesce($4, login_phone),
          phone_number = coalesce($4, phone_number),
          status = 'active', updated_at = now()
      where id = $1
      `,
      [existing.id, normalizedUsername, passwordHash, loginPhone],
    );
    console.log(`Force-updated owner identity for user ${userId} (username=${normalizedUsername}).`);
    return;
  }

  await client.query(
    `
    insert into auth_identities (
      user_id, provider, username, password_hash, login_phone, phone_number, status
    )
    values ($1, 'username_password', $2, $3, $4, $4, 'active')
    `,
    [userId, normalizedUsername, passwordHash, loginPhone],
  );
  console.log(`Created owner identity for user ${userId} (username=${normalizedUsername}).`);
}

async function upsertEmployeeIdentity(client, { userId, pin, loginPhone }) {
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
    if (shouldPreserveExistingOwnerIdentity()) {
      console.log(`Preserved existing employee pin identity for user ${userId}.`);
      return;
    }

    await client.query(
      `
      update auth_identities
      set password_hash = $2,
          login_phone = coalesce($3, login_phone),
          phone_number = coalesce($3, phone_number),
          status = 'active', updated_at = now()
      where id = $1
      `,
      [existing.id, passwordHash, loginPhone],
    );
    console.log(`Updated employee pin identity for user ${userId}.`);
    return;
  }

  await client.query(
    `
    insert into auth_identities (
      user_id, provider, password_hash, login_phone, phone_number, status
    )
    values ($1, 'employee_pin', $2, $3, $3, 'active')
    `,
    [userId, passwordHash, loginPhone],
  );
  console.log(`Created employee pin identity for user ${userId}.`);
}

async function main() {
  const databaseUrl = valueFromEnv("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }
  assertSafeAuthSeedEnv();

  const ownerUserId = valueFromEnv("SEED_OWNER_USER_ID", valueFromEnv("AUTH_OWNER_USER_ID", DEFAULT_OWNER_USER_ID));
  const ownerUsername = valueFromEnv("AUTH_OWNER_USERNAME", "hajri");
  const ownerPassword = valueFromEnv("AUTH_OWNER_PASSWORD", "hajri123");
  const ownerLoginPhone = normalizeOptionalLoginPhone(valueFromEnv("AUTH_OWNER_LOGIN_PHONE"));
  const employeePins = parseEmployeePinMap();
  const employeeLoginPhones = parseEmployeeLoginPhoneMap();

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("begin");
    await upsertOwnerIdentity(client, {
      userId: ownerUserId,
      username: ownerUsername,
      password: ownerPassword,
      loginPhone: ownerLoginPhone,
    });

    for (const [userId, pin] of Object.entries(employeePins)) {
      if (!userId || !pin) continue;
      await upsertEmployeeIdentity(client, {
        userId,
        pin: String(pin),
        loginPhone: employeeLoginPhones[userId] || null,
      });
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
