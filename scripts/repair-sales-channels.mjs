#!/usr/bin/env node
/**
 * Ensure runtime/UI sales channels exist in sales_channels for each mapped store.
 * Reads latest runtime_settings_saved storeChannelSettings when available.
 */

import process from "node:process";
import { readFileSync } from "node:fs";
import { Client } from "pg";

const DEFAULT_ORG = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INCOME_SOURCE_CATALOG = JSON.parse(
  readFileSync(new URL("../src/core/client/income-source-catalog-data.json", import.meta.url), "utf8"),
);
const BOOTSTRAP_STORE_ID_MAP = {
  shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
};

const DEFAULT_SALES_CHANNEL_UUIDS = Object.fromEntries(
  INCOME_SOURCE_CATALOG.map((entry) => [entry.legacyId, entry.uuid]),
);

const CHANNEL_LABELS = Object.fromEntries(
  INCOME_SOURCE_CATALOG.map((entry) => [entry.legacyId, entry.nameAr || entry.nameEn]),
);

const DEFAULT_RUNTIME_CHANNELS = INCOME_SOURCE_CATALOG
  .filter((entry) => entry.defaultActive)
  .map((entry) => ({ id: entry.legacyId }));

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

async function enrichStoreIdMapFromDatabase(client, organizationId, storeIdMap, configuredBusinesses) {
  const enriched = { ...storeIdMap };
  const businesses = configuredBusinesses.filter((b) => typeof b?.id === "string" && b.id.trim());
  const needsFallback = businesses.some((business) => {
    const legacyId = business.id.trim();
    return !UUID_PATTERN.test(legacyId) && !UUID_PATTERN.test(enriched[legacyId] || "");
  });
  if (!needsFallback) return enriched;

  const { rows } = await client.query(
    `SELECT id FROM stores
     WHERE organization_id = $1 AND status = 'active'
     ORDER BY created_at ASC
     LIMIT 1`,
    [organizationId],
  );
  if (rows.length !== 1) return enriched;

  const soleStoreUuid = rows[0].id;
  for (const business of businesses) {
    const legacyId = business.id.trim();
    if (!UUID_PATTERN.test(legacyId) && !UUID_PATTERN.test(enriched[legacyId] || "")) {
      enriched[legacyId] = soleStoreUuid;
    }
  }
  return enriched;
}

function resolveStoreUuid(storeId, storeIdMap) {
  const normalized = String(storeId || "").trim();
  if (!normalized) return "";
  if (UUID_PATTERN.test(normalized)) return normalized;
  const mapped = storeIdMap[normalized];
  return UUID_PATTERN.test(mapped || "") ? mapped : "";
}

function resolveChannelUuid(legacyId, envMap) {
  const normalized = String(legacyId || "").trim();
  if (!normalized) return "";
  if (UUID_PATTERN.test(normalized)) return normalized;
  const fromEnv = envMap[normalized];
  if (UUID_PATTERN.test(fromEnv || "")) return fromEnv;
  const fromDefaults = DEFAULT_SALES_CHANNEL_UUIDS[normalized];
  return UUID_PATTERN.test(fromDefaults || "") ? fromDefaults : "";
}

function channelDisplayName(channel) {
  if (channel?.custom) {
    const nameEn = typeof channel.nameEn === "string" ? channel.nameEn.trim() : "";
    const nameAr = typeof channel.nameAr === "string" ? channel.nameAr.trim() : "";
    return nameEn || nameAr || String(channel.id || "Channel");
  }
  const legacyId = typeof channel?.id === "string" ? channel.id.trim() : "";
  return CHANNEL_LABELS[legacyId] || legacyId || "Channel";
}

function buildSalesChannelIdMap() {
  return {
    ...DEFAULT_SALES_CHANNEL_UUIDS,
    ...parseJsonMap(process.env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP),
  };
}

async function upsertSalesChannel(client, organizationId, storeUuid, channelUuid, channelName) {
  await client.query(
    `INSERT INTO sales_channels (id, organization_id, store_id, name, status)
     VALUES ($1, $2, $3, $4, 'active')
     ON CONFLICT (id) DO UPDATE SET
       organization_id = EXCLUDED.organization_id,
       store_id = EXCLUDED.store_id,
       name = EXCLUDED.name,
       status = 'active'`,
    [channelUuid, organizationId, storeUuid, channelName],
  );
}

function collectStoreChannelJobs(storeChannelSettings, configuredBusinesses, storeIdMap) {
  const jobs = [];
  const settings = storeChannelSettings && typeof storeChannelSettings === "object"
    ? storeChannelSettings
    : {};

  const storeEntries = Object.keys(settings).length
    ? Object.entries(settings)
    : configuredBusinesses.map((business) => [
      business.id,
      {
        channels: DEFAULT_RUNTIME_CHANNELS,
        activeIds: DEFAULT_RUNTIME_CHANNELS.map((channel) => channel.id),
      },
    ]);

  for (const [legacyStoreId, config] of storeEntries) {
    const storeUuid = resolveStoreUuid(legacyStoreId, storeIdMap);
    if (!storeUuid) continue;
    const channels = Array.isArray(config?.channels) ? config.channels : DEFAULT_RUNTIME_CHANNELS;
    const activeIds = Array.isArray(config?.activeIds)
      ? config.activeIds
      : channels.map((channel) => channel.id);
    for (const channel of channels) {
      if (!channel || channel.retired === true) continue;
      const legacyId = typeof channel.id === "string" ? channel.id.trim() : "";
      if (!legacyId || !activeIds.includes(legacyId)) continue;
      jobs.push({
        storeUuid,
        legacyId,
        channel,
      });
    }
  }

  return jobs;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const organizationId = parseOrgId();
  const salesChannelIdMap = buildSalesChannelIdMap();
  const envStoreIdMap = {
    ...BOOTSTRAP_STORE_ID_MAP,
    ...parseJsonMap(process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP),
  };

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

    const settings = rows[0]?.metadata?.settings || {};
    const configuredBusinesses = Array.isArray(settings.configuredBusinesses)
      ? settings.configuredBusinesses
      : [];
    let storeIdMap = buildStoreIdMap(configuredBusinesses, envStoreIdMap);
    storeIdMap = await enrichStoreIdMapFromDatabase(client, organizationId, storeIdMap, configuredBusinesses);

    const jobs = collectStoreChannelJobs(settings.storeChannelSettings, configuredBusinesses, storeIdMap);
    let upserted = 0;

    for (const job of jobs) {
      const channelUuid = resolveChannelUuid(
        typeof job.channel.apiChannelId === "string" ? job.channel.apiChannelId : job.legacyId,
        salesChannelIdMap,
      );
      if (!UUID_PATTERN.test(channelUuid)) {
        console.warn(`Skipped channel ${job.legacyId}: no resolvable UUID`);
        continue;
      }
      await upsertSalesChannel(
        client,
        organizationId,
        job.storeUuid,
        channelUuid,
        channelDisplayName(job.channel),
      );
      upserted += 1;
      console.log(`Upserted sales channel ${job.legacyId} -> ${channelUuid} for store ${job.storeUuid}`);
    }

    console.log(`Done. Upserted ${upserted} sales channel row(s) for org ${organizationId}.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
