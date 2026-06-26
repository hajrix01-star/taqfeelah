#!/usr/bin/env node
/**
 * Rotate owner login credentials in auth_identities.
 *
 * This recovery script never writes plaintext passwords to runtime settings or
 * audit metadata. It requires explicit credentials and a confirmation flag.
 *
 * Usage on VPS:
 *   cd /opt/taqfeelah
 *   set -a && source .env.production && set +a
 *   AUTH_OWNER_RESET_CONFIRM=rotate-owner-auth \
 *   AUTH_OWNER_USER_ID=<owner-user-uuid> \
 *   AUTH_OWNER_USERNAME=<new-login> \
 *   AUTH_OWNER_PASSWORD=<new-password> \
 *   node scripts/reset-owner-auth.mjs
 *   pm2 restart taqfeelah-app
 */

import process from "node:process";
import { Client } from "pg";
import { hashPassword } from "./lib/password-hash.mjs";
import { assertOwnerCredentialResetEnv } from "./lib/auth-seed-policy.mjs";

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

async function main() {
  const databaseUrl = valueFromEnv("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Run: set -a && source .env.production && set +a");
  }
  assertOwnerCredentialResetEnv();

  const ownerUserId = valueFromEnv("SEED_OWNER_USER_ID", valueFromEnv("AUTH_OWNER_USER_ID"));
  const ownerUsername = valueFromEnv("AUTH_OWNER_USERNAME").toLowerCase();
  const ownerPassword = valueFromEnv("AUTH_OWNER_PASSWORD");
  const ownerLoginPhone = valueFromEnv("AUTH_OWNER_LOGIN_PHONE") || null;
  const passwordHash = await hashPassword(ownerPassword);

  console.log("Connecting to database host:", databaseHost(databaseUrl));
  console.log("Owner user:", ownerUserId);

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("begin");
    const existing = await client.query(
      `
      select id, username
      from auth_identities
      where user_id = $1 and provider = 'username_password'
      limit 1
      `,
      [ownerUserId],
    );

    if (existing.rowCount > 0) {
      await client.query(
        `
        update auth_identities
        set username = $2,
            password_hash = $3,
            login_phone = coalesce($4, login_phone),
            phone_number = coalesce($4, phone_number),
            must_change_password = false,
            status = 'active',
            updated_at = now()
        where id = $1
        `,
        [existing.rows[0].id, ownerUsername, passwordHash, ownerLoginPhone],
      );
      console.log(`Updated owner identity for user ${ownerUserId} (username=${ownerUsername}).`);
    } else {
      await client.query(
        `
        insert into auth_identities (
          user_id, provider, username, password_hash, login_phone, phone_number,
          must_change_password, status
        )
        values ($1, 'username_password', $2, $3, $4, $4, false, 'active')
        `,
        [ownerUserId, ownerUsername, passwordHash, ownerLoginPhone],
      );
      console.log(`Created owner identity for user ${ownerUserId} (username=${ownerUsername}).`);
    }

    await client.query("commit");
    console.log("Owner credential rotation completed. Restart the app to clear any stale runtime state.");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
