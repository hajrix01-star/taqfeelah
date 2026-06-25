import { isUuid, mapToUuid, toMoneyHalalas } from "@/core/client/api-id-utils";
import { salesChannelDisplayName } from "@/core/client/sales-channel-catalog";
import { getRuntimeApiMaps } from "@/core/client/runtime-api-maps-state";
import { sanitizeCloseoutChannelDisplayName } from "@/features/daily-closeouts/closeout-sales-normalize";
import { isUuidLike } from "@/features/org-config/client/sales-channel-display";

type SalesRow = Record<string, unknown>;
type StoreChannel = Record<string, unknown>;

function listCloseoutSalesRows(closeout: { sales?: unknown } | null | undefined): SalesRow[] {
  if (Array.isArray(closeout?.sales)) return closeout.sales as SalesRow[];
  return Object.values((closeout?.sales as Record<string, SalesRow> | undefined) || {});
}

function findStoreChannel(storeChannels: StoreChannel[], channelKey = ""): StoreChannel | null {
  const normalized = typeof channelKey === "string" ? channelKey.trim() : "";
  if (!normalized) return null;
  return (Array.isArray(storeChannels) ? storeChannels : []).find((channel) => (
    channel?.id === normalized
    || channel?.legacyId === normalized
    || channel?.apiChannelId === normalized
  )) || null;
}

export function resolveCloseoutSalesChannelId(channelKey = "", storeChannels: StoreChannel[] = []): string {
  const { salesChannelIdMap } = getRuntimeApiMaps();
  const mapped = mapToUuid(channelKey, salesChannelIdMap);
  if (isUuid(mapped)) return mapped;

  const matched = findStoreChannel(storeChannels, channelKey);
  const apiChannelId = typeof matched?.apiChannelId === "string" ? matched.apiChannelId.trim() : "";
  if (isUuid(apiChannelId)) return apiChannelId;
  const channelId = typeof matched?.id === "string" ? matched.id.trim() : "";
  return isUuid(channelId) ? channelId : "";
}

function resolveCloseoutSubmitChannelName(
  row: SalesRow,
  storeChannels: StoreChannel[],
  legacyChannelId: string,
): string {
  const matched = findStoreChannel(storeChannels, legacyChannelId);
  if (matched) return salesChannelDisplayName(matched);
  const raw = row?.name || row?.channelName || row?.channelLabel || "";
  if (typeof raw === "string" && raw.trim() && !isUuidLike(raw)) {
    return raw.trim();
  }
  if (legacyChannelId && !isUuidLike(legacyChannelId)) return legacyChannelId;
  return "";
}

function normalizeSubmitChannelName(rawName: unknown, legacyChannelId = ""): string {
  const fromRaw = sanitizeCloseoutChannelDisplayName(rawName, "");
  if (fromRaw) return fromRaw;
  if (legacyChannelId && !isUuidLike(legacyChannelId)) {
    return sanitizeCloseoutChannelDisplayName(legacyChannelId, "Unknown channel");
  }
  return "Unknown channel";
}

export type ExtractedCloseoutSalesChannel = {
  salesChannelId: string;
  channelName: string;
  amountHalalas: number;
  legacyChannelId: string;
};

export function extractCloseoutSalesChannels(
  closeout: { sales?: unknown } | null | undefined,
  { storeChannels = [] }: { storeChannels?: StoreChannel[] } = {},
): ExtractedCloseoutSalesChannel[] {
  return listCloseoutSalesRows(closeout)
    .map((row) => {
      const legacyChannelId = String(row?.channelId || row?.id || "");
      return {
        salesChannelId: resolveCloseoutSalesChannelId(legacyChannelId, storeChannels),
        channelName: normalizeSubmitChannelName(
          resolveCloseoutSubmitChannelName(row, storeChannels, legacyChannelId),
          legacyChannelId,
        ),
        amountHalalas: toMoneyHalalas(row?.amount),
        legacyChannelId,
      };
    })
    .filter((row) => isUuid(row.salesChannelId) && row.amountHalalas > 0);
}

export function diagnoseCloseoutSalesChannelGaps(
  closeout: { sales?: unknown } | null | undefined,
  { storeChannels = [] }: { storeChannels?: StoreChannel[] } = {},
): Array<{ channelId: string; name: string; amount: number; mapped: boolean }> {
  return listCloseoutSalesRows(closeout)
    .filter((row) => toMoneyHalalas(row?.amount) > 0)
    .map((row) => {
      const channelId = String(row?.channelId || row?.id || "");
      return {
        channelId,
        name: String(row?.name || row?.channelName || ""),
        amount: Number(row?.amount || 0),
        mapped: isUuid(resolveCloseoutSalesChannelId(channelId, storeChannels)),
      };
    })
    .filter((row) => !row.mapped);
}
