#!/usr/bin/env node
/**
 * Wipe ALL experimental tenant/customer data before first live launch.
 *
 * Does NOT re-seed tenant data. Keeps plan_catalog (system plans from migrations).
 *
 * Usage:
 *   node scripts/prelaunch-wipe-all-tenant-data.mjs              # dry-run
 *   PRELAUNCH_WIPE_CONFIRM=wipe-all-tenant-data-for-live \
 *     node scripts/prelaunch-wipe-all-tenant-data.mjs --apply
 */
import process from "node:process";
import { Client } from "pg";

const CONFIRMATION = "wipe-all-tenant-data-for-live";

/** Tables cleared in one TRUNCATE (FK-safe order). plan_catalog is intentionally excluded. */
const WIPE_TABLES = [
  "subscription_renewal_reminders",
  "payment_events",
  "invoices",
  "subscriptions",
  "organization_entitlement_overrides",
  "org_engagement_snapshots",
  "daily_org_metrics",
  "daily_saas_metrics",
  "usage_events",
  "owner_notebook_notes",
  "attachments",
  "entry_sales_channels",
  "audit_events",
  "entries",
  "daily_closeouts",
  "member_invitations",
  "account_setup_tokens",
  "signup_requests",
  "trusted_devices",
  "password_reset_tokens",
  "member_store_access",
  "platform_admin_grants",
  "organization_members",
  "auth_identities",
  "sales_channels",
  "outflow_categories",
  "stores",
  "users",
  "organizations",
];

function assertConfirmed(apply) {
  if (!apply) return;
  if (process.env.PRELAUNCH_WIPE_CONFIRM !== CONFIRMATION) {
    throw new Error(
      `Refusing wipe without PRELAUNCH_WIPE_CONFIRM=${CONFIRMATION}. Run dry-run first.`,
    );
  }
}

async function countRows(client, table) {
  const result = await client.query(`select count(*)::int as count from ${table}`);
  return result.rows[0]?.count ?? 0;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  assertConfirmed(apply);

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    console.log("=== Taqfeelah Pre-Launch Wipe (tenant data) ===");
    console.log(`Mode: ${apply ? "APPLY" : "dry-run"}`);
    console.log("Keeps: plan_catalog");
    console.log("");

    const counts = [];
    for (const table of WIPE_TABLES) {
      try {
        const count = await countRows(client, table);
        counts.push({ table, count });
      } catch {
        counts.push({ table, count: null, missing: true });
      }
    }

    console.log("Rows to wipe:");
    for (const row of counts) {
      if (row.missing) {
        console.log(`  - ${row.table}: (table missing — skipped)`);
      } else {
        console.log(`  - ${row.table}: ${row.count}`);
      }
    }
    console.log("");

    if (!apply) {
      console.log("Dry run only. To wipe:");
      console.log(`  PRELAUNCH_WIPE_CONFIRM=${CONFIRMATION} pnpm prelaunch:wipe --apply`);
      return;
    }

    const existing = WIPE_TABLES.filter((table) => {
      const row = counts.find((entry) => entry.table === table);
      return !row?.missing;
    });

    if (existing.length === 0) {
      console.log("No tables to truncate.");
      return;
    }

    await client.query("begin");
    await client.query(
      `truncate table ${existing.join(", ")} restart identity cascade`,
    );
    await client.query("commit");

    console.log("✅ All experimental tenant data wiped.");
    console.log("Next: pnpm db:migrate (if needed) → SaaS Admin → first real account");
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

const isDirectRun = process.argv[1]?.endsWith("prelaunch-wipe-all-tenant-data.mjs");

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
