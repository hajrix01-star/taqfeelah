#!/usr/bin/env node
/**
 * Full staff provisioning from latest runtime settings:
 * users + organization_members + member_store_access (custom store IDs mapped).
 */

import { randomUUID } from "node:crypto";
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

function staffDisplayName(person) {
  const nameEn = typeof person?.nameEn === "string" ? person.nameEn.trim() : "";
  const nameAr = typeof person?.nameAr === "string" ? person.nameAr.trim() : "";
  return nameEn || nameAr || "Employee";
}

function buildStoreIdMap(configuredBusinesses, envStoreIdMap) {
  const storeIdMap = { ...envStoreIdMap };
  const seededStoreUuids = [...new Set(Object.values(envStoreIdMap).filter((v) => UUID_PATTERN.test(v)))];
  for (const business of configuredBusinesses) {
    const legacyStoreId = typeof business?.id === "string" ? business.id.trim() : "";
    if (!legacyStoreId || UUID_PATTERN.test(legacyStoreId)) continue;
    if (UUID_PATTERN.test(storeIdMap[legacyStoreId] || "")) continue;
    const configuredDbStoreId = typeof business?.dbStoreId === "string" ? business.dbStoreId.trim() : "";
    if (UUID_PATTERN.test(configuredDbStoreId)) {
      storeIdMap[legacyStoreId] = configuredDbStoreId;
      continue;
    }
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

async function ensureUser(client, userId, name) {
  const { rows } = await client.query("SELECT id FROM users WHERE id = $1 LIMIT 1", [userId]);
  if (rows.length > 0) {
    await client.query(
      "UPDATE users SET name = $2, status = 'active', updated_at = NOW() WHERE id = $1",
      [userId, name],
    );
    return userId;
  }
  await client.query(
    "INSERT INTO users (id, name, status) VALUES ($1, $2, 'active')",
    [userId, name],
  );
  console.log(`Created user ${userId} (${name})`);
  return userId;
}

async function ensureOrganizationMember(client, organizationId, userId) {
  const { rows } = await client.query(
    `SELECT id, role FROM organization_members
     WHERE organization_id = $1 AND user_id = $2
     LIMIT 1`,
    [organizationId, userId],
  );
  if (rows[0]?.id) {
    const role = rows[0].role === "owner" || rows[0].role === "manager" ? rows[0].role : "employee";
    await client.query(
      `UPDATE organization_members
       SET status = 'active', role = $2, updated_at = NOW()
       WHERE id = $1`,
      [rows[0].id, role],
    );
    return rows[0].id;
  }
  const memberId = randomUUID();
  await client.query(
    `INSERT INTO organization_members (id, organization_id, user_id, role, status)
     VALUES ($1, $2, $3, 'employee', 'active')`,
    [memberId, organizationId, userId],
  );
  console.log(`Created organization member ${memberId} for user ${userId}`);
  return memberId;
}

async function grantStoreAccess(client, memberId, storeId) {
  const { rowCount } = await client.query(
    `INSERT INTO member_store_access (organization_member_id, store_id)
     SELECT $1, $2
     WHERE NOT EXISTS (
       SELECT 1 FROM member_store_access
       WHERE organization_member_id = $1 AND store_id = $2
     )`,
    [memberId, storeId],
  );
  return rowCount > 0;
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

    let provisionedStaff = 0;
    let grants = 0;

    for (const person of staff) {
      if (!person || person.active === false || person.removed === true) continue;

      let apiUserId = typeof person.apiUserId === "string" ? person.apiUserId.trim() : "";
      if (!UUID_PATTERN.test(apiUserId)) {
        apiUserId = randomUUID();
        console.log(`Assigned new apiUserId ${apiUserId} for staff ${person.id || person.nameEn || "unknown"}`);
      }

      const storeUuids = (Array.isArray(person.storeIds) ? person.storeIds : [])
        .map((storeId) => resolveStoreUuid(storeId, storeIdMap))
        .filter(Boolean);
      if (!storeUuids.length) {
        console.warn(`Skipped staff ${person.id}: no resolvable store UUIDs (storeIds=${JSON.stringify(person.storeIds)})`);
        continue;
      }

      const displayName = staffDisplayName(person);
      await ensureUser(client, apiUserId, displayName);
      const memberId = await ensureOrganizationMember(client, organizationId, apiUserId);
      provisionedStaff += 1;

      for (const storeId of [...new Set(storeUuids)]) {
        const granted = await grantStoreAccess(client, memberId, storeId);
        if (granted) {
          grants += 1;
          console.log(`Granted store ${storeId} to ${displayName} (${apiUserId})`);
        }
      }
    }

    console.log(
      `Done. Provisioned ${provisionedStaff} staff, ${grants} new store access grant(s) for org ${organizationId}.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
