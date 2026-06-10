#!/usr/bin/env node
/**
 * Repairs closeouts stuck as submitted (voided entries, no approval audit).
 *
 * Usage:
 *   DATABASE_URL=... node scripts/repair-stuck-closeouts.mjs
 */

import process from "node:process";
import { Client } from "pg";

const DEFAULT_ORG = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";

function parseOrgId() {
  const index = process.argv.indexOf("--org");
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return process.env.AUTH_ORGANIZATION_ID
    || process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID
    || DEFAULT_ORG;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const organizationId = parseOrgId();
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const { rows: submitRows } = await client.query(
      `SELECT id, store_id, actor_user_id, created_at, metadata
       FROM audit_events
       WHERE organization_id = $1
         AND action IN ('closeout_submitted', 'closeout_resubmitted')
       ORDER BY created_at DESC`,
      [organizationId],
    );

    const latestByKey = new Map();
    for (const row of submitRows) {
      const metadata = row.metadata || {};
      const closeoutId = metadata.closeoutId;
      const date = metadata.date;
      if (!closeoutId || !date) continue;
      const key = `${row.store_id}|${closeoutId}|${date}`;
      if (!latestByKey.has(key)) {
        latestByKey.set(key, row);
      }
    }

    let repaired = 0;

    for (const submit of latestByKey.values()) {
      const metadata = submit.metadata || {};
      const closeoutId = metadata.closeoutId;
      const date = metadata.date;

      const { rows: approvals } = await client.query(
        `SELECT id FROM audit_events
         WHERE organization_id = $1
           AND store_id = $2
           AND action = 'closeout_approved'
           AND metadata ->> 'closeoutId' = $3
           AND metadata ->> 'date' = $4
           AND created_at >= $5
         LIMIT 1`,
        [organizationId, submit.store_id, closeoutId, date, submit.created_at],
      );

      if (approvals.length > 0) continue;

      const entryIds = [
        ...(metadata.summaryEntryId ? [metadata.summaryEntryId] : []),
        ...(Array.isArray(metadata.outflowEntryIds) ? metadata.outflowEntryIds : []),
      ];

      await client.query("BEGIN");
      try {
        if (entryIds.length > 0) {
          await client.query(
            `UPDATE entries
             SET status = 'active', reviewed_at = NOW()
             WHERE organization_id = $1
               AND store_id = $2
               AND id = ANY($3::uuid[])`,
            [organizationId, submit.store_id, entryIds],
          );
        }

        await client.query(
          `INSERT INTO audit_events (
             organization_id, store_id, actor_user_id, action, reason, metadata
           ) VALUES ($1, $2, $3, 'closeout_approved', NULL, $4::jsonb)`,
          [
            organizationId,
            submit.store_id,
            submit.actor_user_id,
            JSON.stringify({
              closeoutId,
              date,
              sourceSubmissionAuditId: submit.id,
              repaired: true,
            }),
          ],
        );

        await client.query("COMMIT");
        repaired += 1;
        console.log(`Repaired closeout ${closeoutId} (${date}) on store ${submit.store_id}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log(`Done. Repaired ${repaired} stuck closeout(s) for org ${organizationId}.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
