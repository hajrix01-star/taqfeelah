#!/usr/bin/env node

import process from "node:process";
import { readFileSync } from "node:fs";
import { Client } from "pg";

const CONFIRMATION = "reset-modern-foundation";
const INCOME_SOURCE_CATALOG = JSON.parse(
  readFileSync(new URL("../src/core/client/income-source-catalog-data.json", import.meta.url), "utf8"),
);
const FOUNDATION_STAFF_CATALOG = JSON.parse(
  readFileSync(new URL("../src/core/client/foundation-staff-catalog-data.json", import.meta.url), "utf8"),
);

const IDS = {
  organization: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
  store: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  owner: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
};

const CHANNELS = INCOME_SOURCE_CATALOG.map((entry) => [entry.legacyId, entry.nameAr, entry.uuid]);

const OUTFLOW_CATEGORIES = [
  ["rent", "Rent"],
  ["salary", "Salary"],
  ["utility", "Utilities"],
  ["phone", "Phone"],
  ["maintenance", "Maintenance"],
  ["other", "Other"],
];

function envValue(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function assertConfirmed() {
  if (process.env.RESET_FOUNDATION_CONFIRM !== CONFIRMATION) {
    throw new Error(`Refusing to reset database without RESET_FOUNDATION_CONFIRM=${CONFIRMATION}`);
  }
}

async function resetData(client) {
  await client.query(`
    truncate table
      payment_events,
      invoices,
      subscriptions,
      daily_org_metrics,
      daily_saas_metrics,
      usage_events,
      attachments,
      entry_sales_channels,
      audit_events,
      entries,
      daily_closeouts,
      member_store_access,
      organization_members,
      auth_identities,
      sales_channels,
      outflow_categories,
      stores,
      users,
      organizations
    restart identity cascade
  `);
}

async function seedCore(client) {
  await client.query(
    `insert into organizations (id, account_number, name, status)
     values ($1, nextval('organization_account_number_seq'), $2, 'active')`,
    [IDS.organization, "شركة النجاح"],
  );

  await client.query(
    `insert into stores (id, organization_id, name, location, status, operational_settings)
     values ($1, $2, $3, $4, 'active', $5::jsonb)`,
    [
      IDS.store,
      IDS.organization,
      "شركة النجاح — الفرع الرئيسي",
      "",
      JSON.stringify({
        activeCategories: OUTFLOW_CATEGORIES.map(([id]) => id),
        employeeHistoryVisibility: "all",
        closeoutAlert: false,
        notebookTheme: null,
      }),
    ],
  );

  const users = [
    [IDS.owner, "محمد الهاجري", "owner"],
    ...FOUNDATION_STAFF_CATALOG.map((person) => [person.userId, person.nameAr || person.nameEn, person.role]),
  ];

  for (const [userId, name] of users) {
    await client.query(
      `insert into users (id, name, status)
       values ($1, $2, 'active')`,
      [userId, name],
    );
  }

  const members = [
    [IDS.owner, "owner"],
    ...FOUNDATION_STAFF_CATALOG.map((person) => [person.userId, person.role]),
  ];

  for (const [userId, role] of members) {
    await client.query(
      `insert into organization_members (organization_id, user_id, role, status)
       values ($1, $2, $3, 'active')`,
      [IDS.organization, userId, role],
    );
  }

  const employeeMembers = await client.query(
    `select id, user_id
     from organization_members
     where organization_id = $1 and role = 'employee'`,
    [IDS.organization],
  );

  for (const row of employeeMembers.rows) {
    await client.query(
      `insert into member_store_access (organization_member_id, store_id)
       values ($1, $2)`,
      [row.id, IDS.store],
    );
  }

  for (const [, name, uuid] of CHANNELS) {
    await client.query(
      `insert into sales_channels (id, organization_id, store_id, name, status)
       values ($1, $2, $3, $4, 'active')`,
      [uuid, IDS.organization, IDS.store, name],
    );
  }

  for (const [, name] of OUTFLOW_CATEGORIES) {
    await client.query(
      `insert into outflow_categories (organization_id, store_id, name, status)
       values ($1, $2, $3, 'active')`,
      [IDS.organization, IDS.store, name],
    );
  }
}

async function seedRuntimeSettings(client) {
  const settings = {
    notebookTheme: "yellow",
    employeePreferences: {},
    ownerShellPreferences: {
      closeoutAlerts: [],
      acknowledgedDuplicateSales: {},
    },
    ownerProfile: {
      name: "محمد الهاجري",
    },
    configuredBusinesses: [
      {
        id: IDS.store,
        legacyId: "shami",
        dbStoreId: IDS.store,
        displayName: "شركة النجاح",
        nameAr: "شركة النجاح",
        nameEn: "Al-Najah Company",
        customLocation: "",
      },
    ],
    archivedBusinessIds: [],
    storeOperationalSettings: {
      [IDS.store]: {
        activeCategories: OUTFLOW_CATEGORIES.map(([id]) => id),
        employeeHistoryVisibility: "all",
        closeoutAlert: false,
        notebookTheme: null,
      },
    },
    staff: FOUNDATION_STAFF_CATALOG.map((person) => ({
      id: person.userId,
      legacyId: person.legacyId,
      apiUserId: person.userId,
      nameAr: person.nameAr,
      nameEn: person.nameEn,
      mobile: "",
      active: true,
      removed: false,
      storeIds: [IDS.store],
    })),
    authConfig: {
      ownerUsername: envValue("AUTH_OWNER_USERNAME", "hajri"),
      ownerPassword: envValue("AUTH_OWNER_PASSWORD", "123"),
      employeePins: Object.fromEntries(
        FOUNDATION_STAFF_CATALOG.flatMap((person) => [
          [person.userId, person.pin],
          [person.legacyId, person.pin],
        ]),
      ),
    },
  };

  await client.query(
    `insert into audit_events (
       organization_id,
       store_id,
       entry_id,
       actor_user_id,
       action,
       reason,
       metadata
     )
     values ($1, null, null, $2, 'runtime_settings_saved', 'reset_modern_foundation', $3::jsonb)`,
    [IDS.organization, IDS.owner, JSON.stringify({ settings, schemaVersion: 2 })],
  );
}

async function verifyFoundation(client) {
  const checks = await client.query(`
    select
      (select count(*) from organizations) as organizations,
      (select count(*) from stores) as stores,
      (select count(*) from users) as users,
      (select count(*) from organization_members where role = 'employee') as employees,
      (select count(*) from member_store_access) as store_access,
      (select count(*) from sales_channels) as sales_channels,
      (select count(*) from outflow_categories) as outflow_categories,
      (select count(*) from entries) as entries,
      (select count(*) from daily_closeouts) as daily_closeouts
  `);
  const row = checks.rows[0];
  console.log("Al-Najah foundation counts:", row);
  if (Number(row.organizations) !== 1) throw new Error("Expected exactly one organization.");
  if (Number(row.stores) !== 1) throw new Error("Expected exactly one store.");
  if (Number(row.employees) !== 2) throw new Error("Expected exactly two employees.");
  if (Number(row.store_access) !== 2) throw new Error("Expected two employee store access grants.");
  if (Number(row.sales_channels) !== CHANNELS.length) {
    throw new Error(`Expected ${CHANNELS.length} sales channels.`);
  }
  if (Number(row.outflow_categories) !== OUTFLOW_CATEGORIES.length) {
    throw new Error(`Expected ${OUTFLOW_CATEGORIES.length} outflow categories.`);
  }
  if (Number(row.entries) !== 0) throw new Error("Expected zero historical entries after reset.");
  if (Number(row.daily_closeouts) !== 0) throw new Error("Expected zero closeouts after reset.");
}

async function main() {
  assertConfirmed();
  const databaseUrl = envValue("DATABASE_URL");
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("begin");
    await resetData(client);
    await seedCore(client);
    await seedRuntimeSettings(client);
    await verifyFoundation(client);
    await client.query("commit");
    console.log("Reset and Al-Najah foundation seed completed.");
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
