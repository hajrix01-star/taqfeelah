#!/usr/bin/env node
/**
 * Seed demo SaaS billing/usage rows for Phase 11 activation prep.
 * Safe to run multiple times — uses fixed UUIDs with upsert semantics.
 */

import process from "node:process";
import { Client } from "pg";

function valueFromEnv(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

const organizationId = valueFromEnv(
  "SEED_ORGANIZATION_ID",
  valueFromEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1"),
);
const subscriptionId = valueFromEnv("SEED_SUBSCRIPTION_ID", "a1b2c3d4-e5f6-4789-a012-saas00000001");
const invoiceId = valueFromEnv("SEED_INVOICE_ID", "b2c3d4e5-f6a7-4890-b123-saas00000002");

async function main() {
  const databaseUrl = valueFromEnv("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("begin");

    await client.query(
      `
      insert into subscriptions (
        id, organization_id, plan_code, status, billing_cycle,
        current_period_start, current_period_end, cancel_at_period_end
      )
      values ($1, $2, 'starter', 'active', 'monthly', now() - interval '15 days', now() + interval '15 days', false)
      on conflict (id) do update set
        status = 'active',
        updated_at = now()
      `,
      [subscriptionId, organizationId],
    );

    await client.query(
      `
      insert into invoices (
        id, organization_id, subscription_id, status, amount_halalas, currency, issued_at, paid_at
      )
      values ($1, $2, $3, 'paid', 9900, 'SAR', now() - interval '10 days', now() - interval '9 days')
      on conflict (id) do update set
        status = 'paid',
        paid_at = coalesce(invoices.paid_at, excluded.paid_at)
      `,
      [invoiceId, organizationId, subscriptionId],
    );

    await client.query(
      `
      insert into payment_events (
        organization_id, invoice_id, event_type, amount_halalas, currency, occurred_at
      )
      select $1, $2, 'payment_succeeded', 9900, 'SAR', now() - interval '9 days'
      where not exists (
        select 1 from payment_events
        where organization_id = $1 and invoice_id = $2 and event_type = 'payment_succeeded'
      )
      `,
      [organizationId, invoiceId],
    );

    await client.query("commit");
    console.log("SaaS foundation seed completed.");
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
