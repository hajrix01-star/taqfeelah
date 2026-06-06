#!/usr/bin/env node
/**
 * Re-sync member_store_access for staff using latest runtime settings snapshot.
 */

import process from "node:process";
import { Client } from "pg";

const DEFAULT_ORG = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseOrgId() {
  const index = process.argv.indexOf("--org");
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return process.env.AUTH_ORGANIZATION_ID
    || process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID
    || DEFAULT_ORG;
}

function parseJsonMap(rawValue) {
  if (!rawValue || typeof rawValue !== "string") return {};
  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function buildStoreIdMap(configuredBusinesses, envStoreIdMap) {
  const storeIdMap = { ...envStoreIdMap };
  const seededStoreUuids = [...new Set(Object.values(envStoreIdMap).filter((v) => UUID_PATTERN.test(v)))];
  for (const business of configuredBusinesses) {
    const legacyStoreId = typeof business?.id === "string" ? business.id.trim() : "";
    if (!legacyStoreId || UUID_PATTERN.test(legacyStoreId)) continue;
    if (UUID_PATTERN.test(storeIdMap[legacyStoreId] || "")) continue;
    if (configuredBusinesses.length === 1 && seededStoreUuids.length === 1) {
      storeIdMap[legacyStoreId] = seededStoreUuids[0];
    }
  }
  return storeIdMap;
}

function resolveStoreUuid(storeId, storeIdMap) {
  const normalized = String(storeId || "").trim();
  if (!normalized) return "";
  if (UUID_PATTERN.test(normalized)) return normalized;
  const mapped = storeIdMap[normalized];
  return UUID_PATTERN.test(mapped || "") ? mapped : "";
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const organizationId = parseOrgId();
  const envStoreIdMap = parseJsonMap(process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP);
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const { rows } = await client.query(
      `SELECT metadata
       FROM audit_events
       WHERE organization_id = $1
         AND action = 'runtime_settings_saved'
       ORDER BY created_at DESC
       LIMIT 1`,
      [organizationId],
    );

    const settings = rows[0]?.metadata?.settings;
    const staff = Array.isArray(settings?.staff) ? settings.staff : [];
    const configuredBusinesses = Array.isArray(settings?.configuredBusinesses)
      ? settings.configuredBusinesses
      : [];
    const storeIdMap = buildStoreIdMap(configuredBusinesses, envStoreIdMap);

    let grants = 0;
    for (const person of staff) {
      if (!person || person.active === false || person.removed === true) continue;
      const apiUserId = typeof person.apiUserId === "string" ? person.apiUserId.trim() : "";
      if (!UUID_PATTERN.test(apiUserId)) continue;

      const storeUuids = (Array.isArray(person.storeIds) ? person.storeIds : [])
        .map((storeId) => resolveStoreUuid(storeId, storeIdMap))
        .filter(Boolean);
      if (!storeUuids.length) continue;

      const { rows: members } = await client.query(
        `SELECT id FROM organization_members
         WHERE organization_id = $1 AND user_id = $2 AND status = 'active'
         LIMIT 1`,
        [organizationId, apiUserId],
      );
      const memberId = members[0]?.id;
      if (!memberId) continue;

      for (const storeId of [...new Set(storeUuids)]) {
        const { rowCount } = await client.query(
          `INSERT INTO member_store_access (organization_member_id, store_id)
           SELECT $1, $2
           WHERE NOT EXISTS (
             SELECT 1 FROM member_store_access
             WHERE organization_member_id = $1 AND store_id = $2
           )`,
          [memberId, storeId],
        );
        if (rowCount > 0) {
          grants += 1;
          console.log(`Granted store ${storeId} to user ${apiUserId} (${person.nameAr || person.nameEn || person.id})`);
        }
      }
    }

    console.log(`Done. ${grants} new store access grant(s) for org ${organizationId}.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
