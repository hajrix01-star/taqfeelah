import {
  isUuid,
  mapToUuid,
  reverseLookupKeyByUuid,
  toMoneyHalalas,
} from "@/core/client/api-id-utils";
import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import {
  getCloseoutApiMaps,
  getRuntimeApiMaps,
  hasCloseoutApiActorMapping,
  hasCloseoutApiStoreMapping,
  setRuntimeApiIdMaps,
} from "@/core/client/runtime-api-maps-state";

export {
  getCloseoutApiMaps,
  getRuntimeApiMaps,
  hasCloseoutApiActorMapping,
  hasCloseoutApiStoreMapping,
  isUuid,
  setRuntimeApiIdMaps,
};

function getMaps() {
  return getRuntimeApiMaps();
}

function listCloseoutSalesRows(closeout) {
  return Array.isArray(closeout?.sales) ? closeout.sales : Object.values(closeout?.sales || {});
}

function extractSalesChannels(closeout) {
  const { salesChannelIdMap } = getMaps();
  return listCloseoutSalesRows(closeout)
    .map((row) => ({
      salesChannelId: mapToUuid(row?.channelId || row?.id, salesChannelIdMap),
      channelName: row?.name || row?.channelName || row?.channelLabel || row?.channelId || row?.id,
      amountHalalas: toMoneyHalalas(row?.amount),
      legacyChannelId: row?.channelId || row?.id || "",
    }))
    .filter((row) => isUuid(row.salesChannelId) && row.amountHalalas > 0);
}

/** Explain why submitCloseoutViaApi would return null (mapping / channel gaps). */
export function diagnoseCloseoutSubmitFailure({
  organizationId,
  actorUserId,
  closeout,
}) {
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  if (!mappedOrganizationId) return { code: "invalid_organization", unmappedChannels: [] };

  const { userIdMap, storeIdMap, salesChannelIdMap } = getMaps();
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  if (!mappedActorUserId) return { code: "unmapped_actor", unmappedChannels: [] };

  const mappedStoreId = mapToUuid(closeout?.storeId, storeIdMap);
  if (!mappedStoreId) return { code: "unmapped_store", unmappedChannels: [] };

  const unmappedChannels = listCloseoutSalesRows(closeout)
    .filter((row) => toMoneyHalalas(row?.amount) > 0)
    .map((row) => ({
      channelId: row?.channelId || row?.id || "",
      name: row?.name || row?.channelName || "",
      amount: Number(row?.amount || 0),
      mapped: isUuid(mapToUuid(row?.channelId || row?.id, salesChannelIdMap)),
    }))
    .filter((row) => !row.mapped);

  if (unmappedChannels.length > 0) {
    return { code: "unmapped_sales_channels", unmappedChannels };
  }

  const salesChannels = extractSalesChannels(closeout);
  if (!salesChannels.length) return { code: "empty_sales", unmappedChannels: [] };

  return null;
}

function extractOutflows(closeout) {
  return (closeout?.outflows || [])
    .map((row) => ({
      type: row?.type,
      amountHalalas: toMoneyHalalas(row?.amount),
      categoryId: isUuid(row?.categoryId) ? row.categoryId : null,
      categoryName: typeof row?.category === "string"
        ? row.category
        : (typeof row?.categoryName === "string" ? row.categoryName : ""),
      typeLabel: typeof row?.typeLabel === "string" ? row.typeLabel : "",
      note: typeof row?.note === "string" ? row.note : "",
    }))
    .filter((row) => (row.type === "purchases" || row.type === "expense" || row.type === "withdrawal") && row.amountHalalas > 0);
}

export async function submitCloseoutViaApi({
  organizationId,
  actorUserId,
  actorRole,
  closeout,
  mode = "submit",
  autoReview = false,
  requireReview = false,
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(closeout?.storeId, storeIdMap);
  if (!mappedStoreId) return null;

  const salesChannels = extractSalesChannels(closeout);
  if (!salesChannels.length) return null;

  return fetchApiJsonWithPrototypeContext(`/api/v1/stores/${mappedStoreId}/closeouts`, {
    organizationId,
    actorUserId,
    actorRole,
    method: "POST",
    body: {
      mode,
      autoReview: autoReview === true,
      requireReview: requireReview === true,
      closeoutId: closeout.id,
      date: closeout.date,
      salesChannels,
      outflows: extractOutflows(closeout),
      note: closeout?.note || "",
    },
    errorMessage: "closeout submit api failed.",
  });
}

export async function fetchStoreCloseoutsViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  dateFrom = "",
  dateTo = "",
}) {
  const { userIdMap, storeIdMap, salesChannelIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mapToUuid(actorUserId, userIdMap) || !isUuid(organizationId) || !mappedStoreId) {
    return [];
  }

  const search = new URLSearchParams();
  if (typeof dateFrom === "string" && dateFrom) search.set("dateFrom", dateFrom);
  if (typeof dateTo === "string" && dateTo) search.set("dateTo", dateTo);
  const query = search.toString();

  const payload = await fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${mappedStoreId}/closeouts${query ? `?${query}` : ""}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "closeout fetch api failed.",
    },
  );

  if (!Array.isArray(payload)) return [];
  return payload.map((item) => {
    if (!item || typeof item !== "object") return item;
    const mappedStoreLegacyId = reverseLookupKeyByUuid(item.storeId, storeIdMap) || storeId;
    const salesRows = Array.isArray(item.sales)
      ? item.sales.map((row) => ({
        ...row,
        channelId: reverseLookupKeyByUuid(row?.channelId, salesChannelIdMap) || row?.channelId,
      }))
      : item.sales;
    return {
      ...item,
      storeId: mappedStoreLegacyId,
      openedByUserId: reverseLookupKeyByUuid(item.openedByUserId, userIdMap) || item.openedByUserId,
      submittedByUserId: reverseLookupKeyByUuid(item.submittedByUserId, userIdMap) || item.submittedByUserId,
      sales: salesRows,
    };
  });
}

export async function reviewCloseoutViaApi({
  organizationId,
  actorUserId,
  actorRole,
  closeout,
  action,
  reason = "",
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(closeout?.storeId, storeIdMap);
  if (!mappedStoreId || !closeout?.id) return null;

  return fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${mappedStoreId}/closeouts/${encodeURIComponent(closeout.id)}/review`,
    {
      organizationId,
      actorUserId,
      actorRole,
      method: "POST",
      body: {
        action,
        date: closeout.date,
        reason,
      },
      errorMessage: "closeout review api failed.",
    },
  );
}
