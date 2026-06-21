import {
  isUuid,
  mapToUuid,
  reverseLookupKeyByUuid,
  toMoneyHalalas,
} from "@/core/client/api-id-utils";
import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import { normalizeCloseoutSubmitMode } from "@/features/closeouts/closeout-submit-mode";
import {
  getCloseoutApiMaps,
  getRuntimeApiMaps,
  hasCloseoutApiActorMapping,
  hasCloseoutApiStoreMapping,
  setRuntimeApiIdMaps,
} from "@/core/client/runtime-api-maps-state";
import { isCloseoutSubmitDateAllowed } from "@/features/closeouts/closeout-submit-date";
import {
  diagnoseCloseoutSalesChannelGaps,
  extractCloseoutSalesChannels,
} from "./resolve-closeout-sales-channels";

export {
  getCloseoutApiMaps,
  getRuntimeApiMaps,
  hasCloseoutApiActorMapping,
  hasCloseoutApiStoreMapping,
  isUuid,
  setRuntimeApiIdMaps,
};

type CloseoutOutflowRow = {
  id?: unknown;
  type?: string;
  amount?: unknown;
  category?: unknown;
  categoryName?: unknown;
  categoryId?: unknown;
  typeLabel?: unknown;
  note?: unknown;
  attachments?: unknown;
};

type CloseoutSubmitPayload = {
  id?: string;
  storeId?: string;
  date?: string;
  note?: string;
  attachments?: unknown;
  outflows?: CloseoutOutflowRow[];
  sales?: unknown;
};

export type CloseoutSubmitFailureCode =
  | "invalid_organization"
  | "unmapped_actor"
  | "unmapped_store"
  | "unmapped_sales_channels"
  | "empty_sales"
  | "invalid_date";

export type CloseoutSubmitFailure = {
  code: CloseoutSubmitFailureCode;
  unmappedChannels: Array<{ channelId: string; name: string; amount: number; mapped: boolean }>;
};

function getMaps() {
  return getRuntimeApiMaps();
}

function buildCloseoutFetchContextError({
  organizationId,
  mappedActorUserId,
  mappedStoreId,
}: {
  organizationId?: string;
  mappedActorUserId: string | null | undefined;
  mappedStoreId: string | null | undefined;
}): Error {
  const missing: string[] = [];
  if (!isUuid(organizationId)) missing.push("organizationId");
  if (!mappedActorUserId) missing.push("actorUserId");
  if (!mappedStoreId) missing.push("storeId");
  return new Error(`closeouts fetch API context missing/invalid: ${missing.join(", ")}.`);
}

export function buildCloseoutSubmitFailureMessage(
  submitFailure: CloseoutSubmitFailure | null | undefined,
  lang: "ar" | "en" = "ar",
): string {
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
    case "invalid_date":
      return lang === "ar"
        ? "تعذر إرسال التقفيلة: تاريخ اليوم غير مقبول على الخادم. اختر تاريخ اليوم أو يومًا سابقًا."
        : "Closeout submit blocked: closeout date is not accepted by the server. Choose today or an earlier date.";
    default:
      return lang === "ar" ? "تعذر الإرسال." : "Failed to send.";
  }
}

export function diagnoseCloseoutSubmitFailure({
  organizationId,
  actorUserId,
  closeout,
  storeChannels = [],
}: {
  organizationId?: string;
  actorUserId?: string;
  closeout?: CloseoutSubmitPayload | null;
  storeChannels?: Array<Record<string, unknown>>;
}): CloseoutSubmitFailure | null {
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  if (!mappedOrganizationId) return { code: "invalid_organization", unmappedChannels: [] };

  const closeoutDate = typeof closeout?.date === "string" ? closeout.date.trim() : "";
  if (closeoutDate && !isCloseoutSubmitDateAllowed(closeoutDate)) {
    return { code: "invalid_date", unmappedChannels: [] };
  }

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
  if (!salesChannels.length && !hasPositiveOutflows(closeout)) {
    return { code: "empty_sales", unmappedChannels: [] };
  }

  return null;
}

function hasPositiveOutflows(closeout: CloseoutSubmitPayload | null | undefined): boolean {
  return (closeout?.outflows || []).some((row) => Number(row?.amount || 0) > 0);
}

function extractAttachmentPayloads(rawList: unknown): string[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => {
      if (typeof item === "string" && item.startsWith("data:")) return item;
      if (item && typeof item === "object" && typeof (item as { dataUrl?: unknown }).dataUrl === "string") {
        const dataUrl = (item as { dataUrl: string }).dataUrl;
        if (dataUrl.startsWith("data:")) return dataUrl;
      }
      return "";
    })
    .filter(Boolean);
}

function optionalTrimmedString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function extractOutflows(closeout: CloseoutSubmitPayload | null | undefined) {
  return (closeout?.outflows || [])
    .map((row) => {
      const categoryName = optionalTrimmedString(
        typeof row?.category === "string" ? row.category : row?.categoryName,
      );
      const typeLabel = optionalTrimmedString(row?.typeLabel);
      const note = optionalTrimmedString(row?.note);
      const payload: Record<string, unknown> = {
        type: row?.type,
        amountHalalas: toMoneyHalalas(row?.amount),
        categoryId: isUuid(row?.categoryId) ? row.categoryId : null,
        attachments: extractAttachmentPayloads(row?.attachments),
      };
      if (categoryName) payload.categoryName = categoryName;
      if (typeLabel) payload.typeLabel = typeLabel;
      if (note) payload.note = note;
      return payload;
    })
    .filter((row) => (
      (row.type === "purchases" || row.type === "expense" || row.type === "withdrawal")
      && Number(row.amountHalalas) > 0
    ));
}

export async function submitCloseoutViaApi({
  organizationId,
  actorUserId,
  actorRole,
  closeout,
  storeChannels = [],
  mode = "submit",
}: {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  closeout?: CloseoutSubmitPayload | null;
  storeChannels?: Array<Record<string, unknown>>;
  mode?: string;
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(closeout?.storeId, storeIdMap);
  if (!mappedStoreId) return null;

  const salesChannels = extractCloseoutSalesChannels(closeout, { storeChannels });
  const outflows = extractOutflows(closeout);
  if (!salesChannels.length && !outflows.length) return null;

  return fetchApiJsonWithPrototypeContext(`/api/v1/stores/${mappedStoreId}/closeouts`, {
    organizationId,
    actorUserId,
    actorRole,
    method: "POST",
    body: {
      mode: normalizeCloseoutSubmitMode(mode),
      closeoutId: closeout?.id,
      date: closeout?.date,
      salesChannels,
      outflows: extractOutflows(closeout),
      attachments: extractAttachmentPayloads(closeout?.attachments),
      ...(optionalTrimmedString(closeout?.note) ? { note: optionalTrimmedString(closeout?.note) } : {}),
    },
    errorMessage: "تعذر إرسال التقفيلة. تحقق من الصور وحاول مرة أخرى.",
  });
}

export async function fetchStoreCloseoutsViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  dateFrom = "",
  dateTo = "",
}: {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  storeId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Array<Record<string, unknown>>> {
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
  search.set("paginated", "1");
  search.set("limit", "50");

  const mergedItems: unknown[] = [];
  let cursor = "";

  while (true) {
    const pageSearch = new URLSearchParams(search);
    if (cursor) pageSearch.set("cursor", cursor);
    const query = pageSearch.toString();

    const payload = await fetchApiJsonWithPrototypeContext(
      `/api/v1/stores/${mappedStoreId}/closeouts?${query}`,
      {
        organizationId,
        actorUserId,
        actorRole,
        errorMessage: "closeout fetch api failed.",
      },
    );

    if (Array.isArray(payload)) {
      mergedItems.push(...payload);
      break;
    }

    if (!payload || typeof payload !== "object" || !Array.isArray((payload as { items?: unknown }).items)) {
      throw new Error("closeouts fetch API returned invalid payload.");
    }

    const page = payload as { items: unknown[]; nextCursor?: unknown };
    mergedItems.push(...page.items);
    cursor = typeof page.nextCursor === "string" ? page.nextCursor : "";
    if (!cursor) break;
  }

  return mergedItems.map((item): Record<string, unknown> => {
    if (!item || typeof item !== "object") return item as Record<string, unknown>;
    const record = item as Record<string, unknown>;
    const mappedStoreLegacyId = reverseLookupKeyByUuid(String(record.storeId), storeIdMap) || storeId;
    const salesRows = Array.isArray(record.sales)
      ? record.sales.map((row) => {
        const salesRow = row as Record<string, unknown>;
        return {
          ...salesRow,
          channelId: reverseLookupKeyByUuid(String(salesRow?.channelId), salesChannelIdMap) || salesRow?.channelId,
        };
      })
      : record.sales;
    return {
      ...record,
      storeId: mappedStoreLegacyId,
      openedByUserId: reverseLookupKeyByUuid(String(record.openedByUserId), userIdMap) || record.openedByUserId,
      submittedByUserId: reverseLookupKeyByUuid(String(record.submittedByUserId), userIdMap) || record.submittedByUserId,
      sales: salesRows,
    };
  });
}

export async function deleteCloseoutViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  closeoutId,
}: {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  storeId?: string;
  closeoutId?: string;
}) {
  const { userIdMap, storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  if (!mappedActorUserId || !isUuid(organizationId) || !mappedStoreId) {
    throw buildCloseoutFetchContextError({
      organizationId,
      mappedActorUserId,
      mappedStoreId,
    });
  }
  if (!closeoutId) {
    throw new Error("closeout delete API requires closeoutId.");
  }

  return fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${mappedStoreId}/closeouts/${encodeURIComponent(closeoutId)}`,
    {
      method: "DELETE",
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "closeout delete api failed.",
    },
  );
}
