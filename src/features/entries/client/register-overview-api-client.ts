import { mapToUuid, reverseLookupKeyByUuid } from "@/core/client/api-id-utils";
import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import { getRuntimeApiMaps } from "@/core/client/runtime-api-maps-state";
import { sanitizeCloseoutChannelDisplayName } from "@/features/daily-closeouts/closeout-sales-normalize";

export type FetchRegisterOverviewViaApiInput = {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  storeIds?: string[];
  period?: string;
  from?: string;
  to?: string;
};

export async function fetchRegisterOverviewViaApi({
  organizationId = "",
  actorUserId = "",
  actorRole = "owner",
  storeIds = [],
  period = "day",
  from = "",
  to = "",
}: FetchRegisterOverviewViaApiInput): Promise<Record<string, unknown>> {
  const { userIdMap, storeIdMap, salesChannelIdMap } = getRuntimeApiMaps();
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreIds = storeIds.map((storeId) => mapToUuid(storeId, storeIdMap)).filter(Boolean);
  if (!organizationId || !mappedActorUserId || !mappedStoreIds.length || !from || !to) {
    throw new Error("register overview API context missing/invalid.");
  }

  const search = new URLSearchParams({
    storeIds: mappedStoreIds.join(","),
    period,
    from,
    to,
  });

  const payload = await fetchApiJsonWithPrototypeContext(`/api/v1/register/overview?${search.toString()}`, {
    organizationId,
    actorUserId,
    actorRole,
    errorMessage: "register overview api failed",
    errorStyle: "status",
  });

  if (!payload || typeof payload !== "object") {
    throw new Error("register overview API returned invalid payload.");
  }

  const record = payload as Record<string, unknown>;
  const rawTotals = record.totalsByStoreId && typeof record.totalsByStoreId === "object"
    ? record.totalsByStoreId as Record<string, unknown>
    : {};
  const totalsByStoreId: Record<string, unknown> = {};
  Object.entries(rawTotals).forEach(([storeId, value]) => {
    totalsByStoreId[reverseLookupKeyByUuid(storeId, storeIdMap) || storeId] = value;
  });

  const closeouts = (Array.isArray(record.closeouts) ? record.closeouts : []).map((item) => {
    if (!item || typeof item !== "object") return item;
    const closeout = item as Record<string, unknown>;
    const storeId = reverseLookupKeyByUuid(String(closeout.storeId || ""), storeIdMap) || closeout.storeId;
    const sales = Array.isArray(closeout.sales)
      ? closeout.sales.map((row) => {
        const salesRow = row as Record<string, unknown>;
        const channelId = reverseLookupKeyByUuid(String(salesRow.channelId || ""), salesChannelIdMap)
          || salesRow.channelId;
        return {
          ...salesRow,
          channelId,
          name: sanitizeCloseoutChannelDisplayName(salesRow.name, String(channelId || "Channel")),
        };
      })
      : closeout.sales;
    return {
      ...closeout,
      storeId,
      openedByUserId: reverseLookupKeyByUuid(String(closeout.openedByUserId || ""), userIdMap) || closeout.openedByUserId,
      submittedByUserId: reverseLookupKeyByUuid(String(closeout.submittedByUserId || ""), userIdMap) || closeout.submittedByUserId,
      sales,
    };
  });

  return {
    ...record,
    totalsByStoreId,
    closeouts,
  };
}
