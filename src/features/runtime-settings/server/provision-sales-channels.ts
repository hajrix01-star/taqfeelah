import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import {
  resolveLegacySalesChannelUuid,
  salesChannelDisplayName,
} from "@/core/client/sales-channel-catalog";
import { salesChannels } from "@/core/db/schema";

type RuntimeChannel = {
  id?: string;
  apiChannelId?: string;
  custom?: boolean;
  nameEn?: string;
  nameAr?: string;
  text?: string;
  retired?: boolean;
};

type StoreChannelConfig = {
  channels?: RuntimeChannel[];
  activeIds?: string[];
};

type StoreChannelSettings = Record<string, StoreChannelConfig | undefined>;

function isUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}

function resolveStoreUuid(storeId: string, storeIdMap: Record<string, string>): string {
  const normalized = storeId.trim();
  if (!normalized) return "";
  if (isUuid(normalized)) return normalized;
  const mapped = storeIdMap[normalized];
  return isUuid(mapped) ? mapped : "";
}

async function ensureSalesChannelRow(
  organizationId: string,
  storeUuid: string,
  channelUuid: string,
  channelName: string,
) {
  const db = getDb();
  const [existing] = await db
    .select({ id: salesChannels.id })
    .from(salesChannels)
    .where(eq(salesChannels.id, channelUuid))
    .limit(1);

  if (existing?.id) {
    await db
      .update(salesChannels)
      .set({
        organizationId,
        storeId: storeUuid,
        name: channelName,
        status: "active",
      })
      .where(eq(salesChannels.id, channelUuid));
    return channelUuid;
  }

  await db.insert(salesChannels).values({
    id: channelUuid,
    organizationId,
    storeId: storeUuid,
    name: channelName,
    status: "active",
  });
  return channelUuid;
}

async function provisionStoreChannels(
  organizationId: string,
  storeUuid: string,
  config: StoreChannelConfig,
  salesChannelIdMap: Record<string, string>,
): Promise<StoreChannelConfig> {
  const channels = Array.isArray(config.channels) ? config.channels : [];
  const activeIds = Array.isArray(config.activeIds) ? config.activeIds : [];
  const provisionedChannels: RuntimeChannel[] = [];

  for (const channel of channels) {
    if (!channel || typeof channel !== "object") continue;
    const legacyId = typeof channel.id === "string" ? channel.id.trim() : "";
    if (!legacyId) {
      provisionedChannels.push(channel);
      continue;
    }

    const isActive = activeIds.includes(legacyId) && channel.retired !== true;
    const existingApiId = typeof channel.apiChannelId === "string" && isUuid(channel.apiChannelId)
      ? channel.apiChannelId
      : "";
    const mappedApiId = resolveLegacySalesChannelUuid(legacyId, salesChannelIdMap);
    let channelUuid = existingApiId || mappedApiId;

    if (!channelUuid && isActive) {
      channelUuid = randomUUID();
    }

    if (channelUuid && isActive) {
      await ensureSalesChannelRow(
        organizationId,
        storeUuid,
        channelUuid,
        salesChannelDisplayName(channel),
      );
    }

    provisionedChannels.push({
      ...channel,
      apiChannelId: channelUuid || channel.apiChannelId,
    });
  }

  return {
    ...config,
    channels: provisionedChannels,
  };
}

export async function provisionSalesChannels(
  organizationId: string,
  storeChannelSettings: unknown,
  options: {
    storeIdMap: Record<string, string>;
    salesChannelIdMap: Record<string, string>;
  },
): Promise<StoreChannelSettings> {
  if (!storeChannelSettings || typeof storeChannelSettings !== "object" || Array.isArray(storeChannelSettings)) {
    return {};
  }

  const input = storeChannelSettings as StoreChannelSettings;
  const output: StoreChannelSettings = {};

  for (const [legacyStoreId, config] of Object.entries(input)) {
    if (!config || typeof config !== "object") {
      output[legacyStoreId] = config;
      continue;
    }
    const storeUuid = resolveStoreUuid(legacyStoreId, options.storeIdMap);
    if (!storeUuid) {
      output[legacyStoreId] = config;
      continue;
    }
    output[legacyStoreId] = await provisionStoreChannels(
      organizationId,
      storeUuid,
      config,
      options.salesChannelIdMap,
    );
  }

  return output;
}
