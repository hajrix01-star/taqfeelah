#!/usr/bin/env node

/**
 * Reconcile trial/test organizations to plan store and employee limits.
 * Archives excess stores and deactivates excess members + pending invitations.
 *
 * Usage:
 *   node scripts/reconcile-organization-entitlements.mjs --dry-run
 *   RECONCILE_ENTITLEMENTS_CONFIRM=apply node scripts/reconcile-organization-entitlements.mjs --apply
 *   ORGANIZATION_ID=<uuid> node scripts/reconcile-organization-entitlements.mjs --apply
 */

import process from "node:process";
import { Client } from "pg";

const CONFIRMATION = "apply";

function envValue(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function parseArgs(argv) {
  return {
    apply: argv.includes("--apply"),
    dryRun: argv.includes("--dry-run") || !argv.includes("--apply"),
    organizationId: envValue("ORGANIZATION_ID"),
  };
}

async function loadPlanLimits(client, organizationId) {
  const { rows } = await client.query(
    `
      SELECT
        COALESCE(o.max_stores_override, p.max_stores) AS max_stores,
        COALESCE(o.max_employees_override, p.max_employees) AS max_employees,
        COALESCE(s.plan_code, 'trial') AS plan_code
      FROM organizations org
      LEFT JOIN LATERAL (
        SELECT plan_code
        FROM subscriptions
        WHERE organization_id = org.id
        ORDER BY updated_at DESC
        LIMIT 1
      ) s ON true
      LEFT JOIN plan_catalog p ON p.plan_code = COALESCE(s.plan_code, 'trial')
      LEFT JOIN organization_entitlement_overrides o ON o.organization_id = org.id
      WHERE org.id = $1
    `,
    [organizationId],
  );
  return rows[0] || null;
}

async function listActiveStores(client, organizationId) {
  const { rows } = await client.query(
    `
      SELECT id, name, created_at
      FROM stores
      WHERE organization_id = $1 AND status = 'active'
      ORDER BY created_at ASC, id ASC
    `,
    [organizationId],
  );
  return rows;
}

async function listSeatHolders(client, organizationId) {
  const { rows: members } = await client.query(
    `
      SELECT om.id, om.user_id, om.role, om.status, om.created_at, u.name
      FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE om.organization_id = $1
        AND om.role IN ('employee', 'manager')
        AND om.status = 'active'
      ORDER BY om.created_at ASC, om.id ASC
    `,
    [organizationId],
  );

  const { rows: invites } = await client.query(
    `
      SELECT id, display_name, created_at
      FROM member_invitations
      WHERE organization_id = $1 AND status = 'pending'
      ORDER BY created_at ASC, id ASC
    `,
    [organizationId],
  );

  return { members, invites };
}

async function reconcileOrganization(client, organizationId, { apply }) {
  const limits = await loadPlanLimits(client, organizationId);
  if (!limits) {
    console.warn(`skip ${organizationId}: organization not found`);
    return;
  }

  const stores = await listActiveStores(client, organizationId);
  const { members, invites } = await listSeatHolders(client, organizationId);
  const seatCount = members.length + invites.length;

  console.log(`\nOrganization ${organizationId}`);
  console.log(`  plan=${limits.plan_code} maxStores=${limits.max_stores} maxEmployees=${limits.max_employees}`);
  console.log(`  activeStores=${stores.length} seats=${seatCount} (${members.length} members + ${invites.length} invites)`);

  const storesToArchive = stores.slice(Number(limits.max_stores));

  let seatExcess = Math.max(0, seatCount - Number(limits.max_employees));
  const invitesToCancel = [];
  for (let index = invites.length - 1; index >= 0 && seatExcess > 0; index -= 1) {
    invitesToCancel.push(invites[index]);
    seatExcess -= 1;
  }
  const membersToDeactivate = [];
  for (let index = members.length - 1; index >= 0 && seatExcess > 0; index -= 1) {
    const member = members[index];
    if (member.role === "owner") continue;
    membersToDeactivate.push(member);
    seatExcess -= 1;
  }

  if (!storesToArchive.length && !invitesToCancel.length && !membersToDeactivate.length) {
    console.log("  already within limits");
    return;
  }

  for (const store of storesToArchive) {
    console.log(`  ${apply ? "archive" : "would archive"} store ${store.id} (${store.name})`);
    if (apply) {
      await client.query(
        `UPDATE stores SET status = 'archived', updated_at = now() WHERE id = $1`,
        [store.id],
      );
    }
  }

  for (const invite of invitesToCancel) {
    console.log(`  ${apply ? "cancel" : "would cancel"} invite ${invite.id} (${invite.display_name || "unnamed"})`);
    if (apply) {
      await client.query(
        `UPDATE member_invitations SET status = 'revoked', revoked_at = now(), updated_at = now() WHERE id = $1`,
        [invite.id],
      );
    }
  }

  for (const member of membersToDeactivate) {
    console.log(`  ${apply ? "deactivate" : "would deactivate"} member ${member.id} (${member.name || member.role})`);
    if (apply) {
      await client.query(
        `UPDATE organization_members SET status = 'inactive', updated_at = now() WHERE id = $1`,
        [member.id],
      );
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.apply && process.env.RECONCILE_ENTITLEMENTS_CONFIRM !== CONFIRMATION) {
    throw new Error(`Refusing to apply without RECONCILE_ENTITLEMENTS_CONFIRM=${CONFIRMATION}`);
  }

  const databaseUrl = envValue("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const organizationIds = args.organizationId
      ? [args.organizationId]
      : (await client.query(
        `SELECT id FROM organizations WHERE status = 'active' ORDER BY created_at ASC`,
      )).rows.map((row) => row.id);

    console.log(`${args.apply ? "Applying" : "Dry-run"} reconciliation for ${organizationIds.length} organization(s)`);
    for (const organizationId of organizationIds) {
      await reconcileOrganization(client, organizationId, { apply: args.apply });
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
