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
import {
  diagnoseCloseoutSalesChannelGaps,
  extractCloseoutSalesChannels,
} from "./resolve-closeout-sales-channels.js";

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

function buildCloseoutFetchContextError({ organizationId, mappedActorUserId, mappedStoreId }) {
  const missing = [];
  if (!isUuid(organizationId)) missing.push("organizationId");
  if (!mappedActorUserId) missing.push("actorUserId");
  if (!mappedStoreId) missing.push("storeId");
  return new Error(`closeouts fetch API context missing/invalid: ${missing.join(", ")}.`);
}

export function buildCloseoutSubmitFailureMessage(submitFailure, lang = "ar") {
  if (!submitFailure) return "";
  const channelNames = (submitFailure.unmappedChannels || [])
    .map((row) => row.name || row.channelId)
    .filter(Boolean)
    .join(", ");

  switch (submitFailure.code) {
    case "invalid_organization":
      return lang === "ar"
        ? "تعذر إرسال التقفيلة: معرف المنظمة غير صالح لمسار API."
        : "Closeout submit blocked: organization id is missing/invalid for API.";
    case "unmapped_actor":
      return lang === "ar"
        ? "تعذر إرسال التقفيلة: معرف المستخدم غير مربوط بالخادم."
        : "Closeout submit blocked: user id is not mapped to the server.";
    case "unmapped_store":
      return lang === "ar"
        ? "تعذر إرسال التقفيلة: معرف المحل غير مربوط بالخادم."
        : "Closeout submit blocked: store id is not mapped to the server.";
    case "unmapped_sales_channels":
      return lang === "ar"
        ? `تعذر إرسال التقفيلة: قنوات البيع غير مربوطة بالخادم (${channelNames || "غير معروف"}). انتظر تحميل إعدادات المحل ثم أعد المحاولة.`
        : `Closeout submit blocked: sales channels are not mapped to the server (${channelNames || "unknown"}). Wait for store settings to load, then retry.`;
    case "empty_sales":
      return lang === "ar"
        ? "تعذر إرسال التقفيلة: أدخل مبلغ الداخل في قناة بيع واحدة على الأقل."
        : "Closeout submit blocked: enter at least one positive sales amount.";
    default:
      return lang === "ar" ? "تعذر الإرسال." : "Failed to send.";
  }
}

/**
 * Explain why submitCloseoutViaApi would return null (mapping / channel gaps).
 * @param {{ organizationId?: string, actorUserId?: string, closeout?: object, storeChannels?: Array<Record<string, unknown>> }} input
 */
export function diagnoseCloseoutSubmitFailure({
  organizationId,
  actorUserId,
  closeout,
  storeChannels = [],
}) {
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  if (!mappedOrganizationId) return { code: "invalid_organization", unmappedChannels: [] };

  const { userIdMap, storeIdMap } = getMaps();
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  if (!mappedActorUserId) return { code: "unmapped_actor", unmappedChannels: [] };

  const mappedStoreId = mapToUuid(closeout?.storeId, storeIdMap);
  if (!mappedStoreId) return { code: "unmapped_store", unmappedChannels: [] };

  const unmappedChannels = diagnoseCloseoutSalesChannelGaps(closeout, { storeChannels });
  if (unmappedChannels.length > 0) {
    return { code: "unmapped_sales_channels", unmappedChannels };
  }

  const salesChannels = extractCloseoutSalesChannels(closeout, { storeChannels });
  if (!salesChannels.length) return { code: "empty_sales", unmappedChannels: [] };

  return null;
}

function extractAttachmentPayloads(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList.filter((item) => typeof item === "string" && item.startsWith("data:"));
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
      attachments: extractAttachmentPayloads(row?.attachments),
    }))
    .filter((row) => (row.type === "purchases" || row.type === "expense" || row.type === "withdrawal") && row.amountHalalas > 0);
}

/**
 * @param {{ organizationId?: string, actorUserId?: string, actorRole?: string, closeout?: object, storeChannels?: Array<Record<string, unknown>>, mode?: string }} input
 */
export async function submitCloseoutViaApi({
  organizationId,
  actorUserId,
  actorRole,
  closeout,
  storeChannels = [],
  mode = "submit",
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(closeout?.storeId, storeIdMap);
  if (!mappedStoreId) return null;

  const salesChannels = extractCloseoutSalesChannels(closeout, { storeChannels });
  if (!salesChannels.length) return null;

  return fetchApiJsonWithPrototypeContext(`/api/v1/stores/${mappedStoreId}/closeouts`, {
    organizationId,
    actorUserId,
    actorRole,
    method: "POST",
    body: {
      mode,
      closeoutId: closeout.id,
      date: closeout.date,
      salesChannels,
      outflows: extractOutflows(closeout),
      attachments: extractAttachmentPayloads(closeout?.attachments),
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
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  if (!mappedActorUserId || !isUuid(organizationId) || !mappedStoreId) {
    throw buildCloseoutFetchContextError({
      organizationId,
      mappedActorUserId,
      mappedStoreId,
    });
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

  if (!Array.isArray(payload)) {
    throw new Error("closeouts fetch API returned invalid payload.");
  }
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

