import { isUuid, mapToUuid, toMoneyHalalas } from "@/core/client/api-id-utils";
import { salesChannelDisplayName } from "@/core/client/sales-channel-catalog";
import { getRuntimeApiMaps } from "@/core/client/runtime-api-maps-state";

function listCloseoutSalesRows(closeout) {
  return Array.isArray(closeout?.sales) ? closeout.sales : Object.values(closeout?.sales || {});
}

function findStoreChannel(storeChannels, channelKey = "") {
  const normalized = typeof channelKey === "string" ? channelKey.trim() : "";
  if (!normalized) return null;
  return (Array.isArray(storeChannels) ? storeChannels : []).find((channel) => (
    channel?.id === normalized
    || channel?.legacyId === normalized
    || channel?.apiChannelId === normalized
  )) || null;
}

/** @param {Array<Record<string, unknown>>} [storeChannels] */
export function resolveCloseoutSalesChannelId(channelKey = "", storeChannels = []) {
  const { salesChannelIdMap } = getRuntimeApiMaps();
  const mapped = mapToUuid(channelKey, salesChannelIdMap);
  if (isUuid(mapped)) return mapped;

  const matched = findStoreChannel(storeChannels, channelKey);
  const apiChannelId = typeof matched?.apiChannelId === "string" ? matched.apiChannelId.trim() : "";
  if (isUuid(apiChannelId)) return apiChannelId;
  const channelId = typeof matched?.id === "string" ? matched.id.trim() : "";
  return isUuid(channelId) ? channelId : "";
}

function resolveCloseoutSubmitChannelName(row, storeChannels, legacyChannelId) {
  const matched = findStoreChannel(storeChannels, legacyChannelId);
  if (matched) return salesChannelDisplayName(matched);
  return row?.name || row?.channelName || row?.channelLabel || legacyChannelId || "";
}

function normalizeSubmitChannelName(rawName, legacyChannelId = "") {
  const trimmed = typeof rawName === "string" ? rawName.trim() : "";
  if (trimmed) return trimmed.slice(0, 120);
  const legacy = typeof legacyChannelId === "string" ? legacyChannelId.trim() : "";
  return legacy || "Channel";
}

/** @param {{ storeChannels?: Array<Record<string, unknown>> }} [options] */
export function extractCloseoutSalesChannels(closeout, { storeChannels = [] } = {}) {
  return listCloseoutSalesRows(closeout)
    .map((row) => {
      const legacyChannelId = row?.channelId || row?.id || "";
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

/** @param {{ storeChannels?: Array<Record<string, unknown>> }} [options] */
export function diagnoseCloseoutSalesChannelGaps(closeout, { storeChannels = [] } = {}) {
  return listCloseoutSalesRows(closeout)
    .filter((row) => toMoneyHalalas(row?.amount) > 0)
    .map((row) => {
      const channelId = row?.channelId || row?.id || "";
      return {
        channelId,
        name: row?.name || row?.channelName || "",
        amount: Number(row?.amount || 0),
        mapped: isUuid(resolveCloseoutSalesChannelId(channelId, storeChannels)),
      };
    })
    .filter((row) => !row.mapped);
}
