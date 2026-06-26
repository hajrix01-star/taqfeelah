import {
  isUuid,
  mapToUuid,
  reverseLookupKeyByUuid,
  toMoneyHalalas,
} from "@/core/client/api-id-utils";
import { fetchApiJsonWithRuntimeContext } from "@/core/client/api-fetch";
import {
  getRuntimeApiMaps,
  setRuntimeApiIdMaps,
} from "@/core/client/runtime-api-maps-state";
import type {
  AcknowledgeDuplicateSummariesViaApiInput,
  ApproveDuplicateSummaryViaApiInput,
  FetchNotebookExportViaApiInput,
  RegisterInlineAttachmentViaApiInput,
  RuntimeApiIdMapOverrides,
} from "@/features/exports-attachments/client/exports-attachments-client-types";
import type { OperationalEntryPayload } from "@/features/entries/client/entries-client-types";

export function setExportsAttachmentsRuntimeApiIdMaps(overrides: RuntimeApiIdMapOverrides) {
  setRuntimeApiIdMaps(overrides);
}

function getMaps() {
  return getRuntimeApiMaps();
}

function mapSummaryPayloadToApiBody(payload: OperationalEntryPayload) {
  const { salesChannelIdMap } = getMaps();
  const salesChannels = (payload?.salesChannels || [])
    .map((row) => ({
      salesChannelId: mapToUuid(row?.channelId || row?.id, salesChannelIdMap),
      channelName: row?.name || row?.channelName || row?.channelLabel || row?.channelId || row?.id,
      amountHalalas: toMoneyHalalas(row?.amount),
    }))
    .filter((row) => isUuid(row.salesChannelId) && row.amountHalalas > 0);

  const attachment = payload?.attachment && typeof payload.attachment === "object"
    ? {
      kind: "image",
      name: payload.attachment.name || "attachment.jpg",
      mimeType: payload.attachment.mimeType || "image/jpeg",
      sizeBytes: Number(payload.attachment.sizeBytes || 0),
      ...(payload.attachment.storageKey
        ? { storageKey: payload.attachment.storageKey }
        : { dataUrl: payload.attachment.dataUrl || "" }),
    }
    : undefined;

  return {
    type: "summary",
    note: typeof payload?.note === "string" ? payload.note : "",
    salesChannels,
    attachment,
  };
}

export async function approveDuplicateSummaryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  date,
  payload,
}: ApproveDuplicateSummaryViaApiInput) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedStoreId || !isUuid(organizationId) || !date) return null;

  return fetchApiJsonWithRuntimeContext(
    `/api/v1/stores/${mappedStoreId}/entries/duplicate-summary/approve`,
    {
      organizationId,
      actorUserId,
      actorRole,
      method: "POST",
      body: {
        date,
        payload: mapSummaryPayloadToApiBody(payload),
      },
      errorMessage: "duplicate summary approve api failed",
      errorStyle: "status",
    },
  );
}

export async function acknowledgeDuplicateSummariesViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  date,
  entryIds,
}: AcknowledgeDuplicateSummariesViaApiInput) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  const mappedEntryIds = (Array.isArray(entryIds) ? entryIds : []).filter((value) => isUuid(value));
  if (!mappedStoreId || !isUuid(organizationId) || !date || !mappedEntryIds.length) return null;

  return fetchApiJsonWithRuntimeContext(
    `/api/v1/stores/${mappedStoreId}/entries/duplicate-summary/acknowledge`,
    {
      organizationId,
      actorUserId,
      actorRole,
      method: "POST",
      body: {
        date,
        entryIds: mappedEntryIds,
      },
      errorMessage: "duplicate summary acknowledge api failed",
      errorStyle: "status",
    },
  );
}

export async function fetchNotebookExportViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  period = "day",
  from = "",
  to = "",
  date = "",
  month = "",
}: FetchNotebookExportViaApiInput) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedStoreId || !isUuid(organizationId)) return null;

  const search = new URLSearchParams({
    storeId: mappedStoreId,
    period,
  });
  if (from) search.set("from", from);
  if (to) search.set("to", to);
  if (date) search.set("date", date);
  if (month) search.set("month", month);

  const payload = await fetchApiJsonWithRuntimeContext(
    `/api/v1/exports/notebook?${search.toString()}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "notebook export api failed",
      errorStyle: "status",
    },
  ) as Record<string, unknown>;

  return {
    ...payload,
    storeId: reverseLookupKeyByUuid(String(payload?.storeId || ""), storeIdMap) || storeId,
  };
}

export async function registerInlineAttachmentViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  attachment,
}: RegisterInlineAttachmentViaApiInput) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedStoreId || !isUuid(organizationId) || !attachment) return null;

  return fetchApiJsonWithRuntimeContext(
    `/api/v1/stores/${mappedStoreId}/attachments/inline`,
    {
      organizationId,
      actorUserId,
      actorRole,
      method: "POST",
      body: { attachment },
      errorMessage: "inline attachment api failed",
      errorStyle: "status",
    },
  );
}
