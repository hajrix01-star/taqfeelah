#!/usr/bin/env node
/**
 * Optional LOCAL DEV bootstrap only — not for production launch.
 *
 * Production customers are created via SaaS Admin (`/saas-admin/accounts/new`).
 * Before first public launch, prefer an empty database + SaaS provisioning.
 *
 * Usage: DATABASE_URL=... node scripts/seed-closeouts-foundation.mjs
 */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import process from "node:process";
import { Client } from "pg";

const INCOME_SOURCE_CATALOG = JSON.parse(
  readFileSync(new URL("../src/core/client/income-source-catalog-data.json", import.meta.url), "utf8"),
);
const FOUNDATION_STAFF_CATALOG = JSON.parse(
  readFileSync(new URL("../src/core/client/foundation-staff-catalog-data.json", import.meta.url), "utf8"),
);

function valueFromEnv(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

const DEFAULTS = {
  organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
  organizationName: "Local Dev Bootstrap (not a customer)",
  storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  storeName: "مشويات المعلم الشامي",
  ownerUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
  ownerName: "Owner",
  staff: FOUNDATION_STAFF_CATALOG,
  salesChannels: INCOME_SOURCE_CATALOG.map((entry) => ({
    legacyId: entry.legacyId,
    id: entry.uuid,
    name: entry.nameAr || entry.nameEn,
  })),
};

function buildConfig() {
  return {
    organizationId: valueFromEnv("SEED_ORGANIZATION_ID", DEFAULTS.organizationId),
    organizationName: valueFromEnv("SEED_ORGANIZATION_NAME", DEFAULTS.organizationName),
    storeId: valueFromEnv("SEED_STORE_ID", DEFAULTS.storeId),
    storeName: valueFromEnv("SEED_STORE_NAME", DEFAULTS.storeName),
    ownerUserId: valueFromEnv("SEED_OWNER_USER_ID", DEFAULTS.ownerUserId),
    ownerName: valueFromEnv("SEED_OWNER_NAME", DEFAULTS.ownerName),
    staff: DEFAULTS.staff,
  };
}

async function upsertFoundation(client, cfg) {
  await client.query("begin");
  try {
    await client.query(
      `
      insert into organizations (id, account_number, name, status)
      values ($1, nextval('organization_account_number_seq'), $2, 'active')
      on conflict (id) do update set
        name = excluded.name,
        status = 'active',
        updated_at = now()
      `,
      [cfg.organizationId, cfg.organizationName],
    );

    await client.query(
      `
      insert into stores (id, organization_id, name, status)
      values ($1, $2, $3, 'active')
      on conflict (id) do update set
        organization_id = excluded.organization_id,
        name = excluded.name,
        status = 'active',
        updated_at = now()
      `,
      [cfg.storeId, cfg.organizationId, cfg.storeName],
    );

    const users = [
      { id: cfg.ownerUserId, name: cfg.ownerName, role: "owner" },
      ...cfg.staff.map((person) => ({
        id: person.userId,
        name: person.nameAr || person.nameEn,
        role: person.role || "employee",
      })),
    ];

    const memberIds = {};
    for (const user of users) {
      await client.query(
        `
        insert into users (id, name, status)
        values ($1, $2, 'active')
        on conflict (id) do update set
          name = excluded.name,
          status = 'active',
          updated_at = now()
        `,
        [user.id, user.name],
      );

      const existingMember = await client.query(
        `
        select id
        from organization_members
        where organization_id = $1 and user_id = $2 and status = 'active'
        limit 1
        `,
        [cfg.organizationId, user.id],
      );

      if (existingMember.rowCount > 0) {
        const memberId = existingMember.rows[0].id;
        await client.query(
          `
          update organization_members
          set role = $1, updated_at = now()
          where id = $2
          `,
          [user.role, memberId],
        );
        memberIds[user.id] = memberId;
      } else {
        const memberId = randomUUID();
        await client.query(
          `
          insert into organization_members (id, organization_id, user_id, role, status)
          values ($1, $2, $3, $4, 'active')
          `,
          [memberId, cfg.organizationId, user.id, user.role],
        );
        memberIds[user.id] = memberId;
      }
    }

    for (const employeeUserId of cfg.staff.map((person) => person.userId)) {
      await client.query(
        `
        insert into member_store_access (organization_member_id, store_id)
        values ($1, $2)
        on conflict (organization_member_id, store_id) do nothing
        `,
        [memberIds[employeeUserId], cfg.storeId],
      );
    }

    for (const channel of DEFAULTS.salesChannels) {
      await client.query(
        `
        insert into sales_channels (id, organization_id, store_id, name, status)
        values ($1, $2, $3, $4, 'active')
        on conflict (id) do update set
          organization_id = excluded.organization_id,
          store_id = excluded.store_id,
          name = excluded.name,
          status = 'active'
        `,
        [channel.id, cfg.organizationId, cfg.storeId, channel.name],
      );
    }

    await client.query("commit");

    console.log("Seed completed.\n");
    console.log("Use these values in .env.local:");
    console.log(`NEXT_PUBLIC_CLOSEOUTS_API_ENABLED=true`);
    console.log(`NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID=${cfg.organizationId}`);
    console.log(`NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID=${cfg.ownerUserId}`);
    console.log(
      `NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP=${JSON.stringify({ shami: cfg.storeId })}`,
    );
    console.log(
      `NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP=${JSON.stringify({
        owner: cfg.ownerUserId,
        ...Object.fromEntries(cfg.staff.map((person) => [person.legacyId, person.userId])),
      })}`,
    );
    console.log(
      `NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP=${JSON.stringify(
        Object.fromEntries(DEFAULTS.salesChannels.map((channel) => [channel.legacyId, channel.id])),
      )}`,
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function seedRuntimeSettings(client, cfg) {
  const existing = await client.query(
    `
    select id
    from audit_events
    where organization_id = $1
      and store_id is null
      and action = 'runtime_settings_saved'
    limit 1
    `,
    [cfg.organizationId],
  );
  if (existing.rowCount > 0) {
    console.log("Runtime settings already seeded.");
    return;
  }

  const settings = {
    notebookTheme: "yellow",
    configuredBusinesses: [
      {
        id: "shami",
        nameAr: cfg.storeName,
        nameEn: "Al-Shami Grill",
        location: "",
      },
    ],
    staff: cfg.staff.map((person) => ({
      id: person.legacyId,
      legacyId: person.legacyId,
      nameAr: person.nameAr,
      nameEn: person.nameEn,
      mobile: "",
      active: true,
      removed: false,
      storeIds: ["shami"],
      apiUserId: person.userId,
    })),
    authConfig: {
      ownerUsername: process.env.AUTH_OWNER_USERNAME || "hajri",
      ownerPassword: process.env.AUTH_OWNER_PASSWORD || "123",
      employeePins: Object.fromEntries(cfg.staff.map((person) => [person.legacyId, person.pin])),
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
    values ($1, null, null, $2, 'runtime_settings_saved', 'seed_runtime_settings', $3::jsonb)
    `,
    [cfg.organizationId, cfg.ownerUserId, JSON.stringify({ settings, schemaVersion: 1 })],
  );
  console.log("Runtime settings seed completed.");
}

async function main() {
  const databaseUrl = valueFromEnv("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const cfg = buildConfig();
    await upsertFoundation(client, cfg);
    await seedRuntimeSettings(client, cfg);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
