import {
  isUuid,
  mapToUuid,
  reverseLookupKeyByUuid,
  toMoneyHalalas,
} from "@/core/client/api-id-utils";
import { isEntriesApiDbSourceMode } from "@/core/config/entries-api-mode";
import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import {
  getRuntimeApiMaps,
  setRuntimeApiIdMaps as applyRuntimeApiIdMaps,
} from "@/core/client/runtime-api-maps-state";
import { resolvePrototypeApiContext } from "@/core/client/prototype-api-context";
import { closeoutRequiredEntryMessage } from "@/features/operations/client/closeout-required-entry-message";
import type {
  CreateStoreEntryApiBody,
  CreateStoreEntryApiPayload,
  EntriesApiActorParams,
  FetchStoreEntriesPageParams,
  FetchStoreEntriesParams,
  OperationalEntry,
  OperationalEntrySalesChannelRow,
  RuntimeApiIdMapOverrides,
} from "./entries-client-types";

export function setRuntimeApiIdMaps(overrides: RuntimeApiIdMapOverrides): void {
  applyRuntimeApiIdMaps(overrides);
}

function getMaps() {
  return getRuntimeApiMaps();
}

function assertEntriesApiContext(
  context: { storeId: string } | null,
  resource: string,
): asserts context is { storeId: string } {
  if (!context) {
    throw new Error(`${resource} API context missing/invalid: organizationId, actorUserId, or storeId mapping.`);
  }
}

function resolveEntriesItemsPayload(payload: unknown, resource: string): OperationalEntry[] {
  if (Array.isArray(payload)) return payload as OperationalEntry[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: OperationalEntry[] }).items;
  }
  throw new Error(`${resource} API returned invalid payload.`);
}

type EntriesPagePayload = {
  items: OperationalEntry[];
  nextCursor?: string | null;
};

function assertEntriesPagePayload(payload: unknown): asserts payload is EntriesPagePayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !Array.isArray((payload as EntriesPagePayload).items)) {
    throw new Error("entries page API returned invalid payload.");
  }
}

function mapEntryItems(
  items: OperationalEntry[],
  {
    storeId,
    storeIdMap,
    salesChannelIdMap,
  }: {
    storeId: string;
    storeIdMap: Record<string, string>;
    salesChannelIdMap: Record<string, string>;
  },
): OperationalEntry[] {
  return items.map((item) => {
    if (!item || typeof item !== "object") return item;
    const mappedBusinessId = reverseLookupKeyByUuid(item.businessId, storeIdMap) || storeId;
    const mappedSalesChannels = Array.isArray(item.salesChannels)
      ? item.salesChannels.map((row: OperationalEntrySalesChannelRow) => ({
        ...row,
        channelId: reverseLookupKeyByUuid(row?.channelId, salesChannelIdMap) || row?.channelId,
      }))
      : [];
    return {
      ...item,
      businessId: mappedBusinessId,
      salesChannels: mappedSalesChannels,
    };
  });
}

export async function fetchStoreEntriesViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  dateFrom = "",
  dateTo = "",
  status = "all",
  limit = 800,
}: FetchStoreEntriesParams): Promise<OperationalEntry[]> {
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  assertEntriesApiContext(context, "entries fetch");

  const search = new URLSearchParams();
  if (typeof dateFrom === "string" && dateFrom) search.set("dateFrom", dateFrom);
  if (typeof dateTo === "string" && dateTo) search.set("dateTo", dateTo);
  if (status === "active" || status === "voided" || status === "all") search.set("status", status);
  if (Number.isInteger(limit) && limit > 0) search.set("limit", String(limit));

  const payload = await fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${context.storeId}/entries?${search.toString()}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "entries fetch api failed",
      errorStyle: "status",
    },
  );

  const { storeIdMap, salesChannelIdMap } = getMaps();
  const items = resolveEntriesItemsPayload(payload, "entries fetch");
  return mapEntryItems(items, { storeId, storeIdMap, salesChannelIdMap });
}

export async function fetchStoreEntriesPageViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  dateFrom = "",
  dateTo = "",
  status = "all",
  limit = 50,
  cursor = "",
}: FetchStoreEntriesPageParams): Promise<{ items: OperationalEntry[]; nextCursor: string | null }> {
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  assertEntriesApiContext(context, "entries page");

  const search = new URLSearchParams({ paginated: "1" });
  if (typeof dateFrom === "string" && dateFrom) search.set("dateFrom", dateFrom);
  if (typeof dateTo === "string" && dateTo) search.set("dateTo", dateTo);
  if (status === "active" || status === "voided" || status === "all") search.set("status", status);
  if (Number.isInteger(limit) && limit > 0) search.set("limit", String(limit));
  if (typeof cursor === "string" && cursor) search.set("cursor", cursor);

  const payload = await fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${context.storeId}/entries?${search.toString()}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "entries page fetch api failed",
      errorStyle: "status",
    },
  );

  const { storeIdMap, salesChannelIdMap } = getMaps();
  assertEntriesPagePayload(payload);
  const rawItems = payload.items;
  return {
    items: mapEntryItems(rawItems, { storeId, storeIdMap, salesChannelIdMap }),
    nextCursor: typeof payload?.nextCursor === "string" ? payload.nextCursor : null,
  };
}

function resolveEntrySalesChannelUuid(
  channelId: string | undefined,
  salesChannelIdMap: Record<string, string>,
): string {
  const mapped = mapToUuid(channelId, salesChannelIdMap);
  if (isUuid(mapped)) return mapped;
  if (typeof channelId === "string" && isUuid(channelId.trim())) return channelId.trim();
  return "";
}

export async function createStoreEntryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  payload,
}: EntriesApiActorParams & { payload: CreateStoreEntryApiPayload }): Promise<unknown> {
  const { salesChannelIdMap } = getMaps();
  const context = resolvePrototypeApiContext({
    organizationId,
    actorUserId,
    actorRole,
    storeId: payload?.businessId,
  });
  if (!context) return null;

  if (isEntriesApiDbSourceMode() && !isUuid(payload?.closeoutDbId)) {
    throw new Error(closeoutRequiredEntryMessage("en"));
  }

  const mappedSalesChannels = (payload?.salesChannels || [])
    .map((row) => ({
      salesChannelId: resolveEntrySalesChannelUuid(row?.channelId || row?.id, salesChannelIdMap),
      channelName: row?.name || row?.channelName || row?.channelLabel || row?.channelId || row?.id,
      amountHalalas: toMoneyHalalas(row?.amount),
    }))
    .filter((row) => isUuid(row.salesChannelId) && row.amountHalalas > 0);

  if (payload?.type === "summary" && mappedSalesChannels.length === 0) {
    throw new Error("entry create failed: summary requires at least one mapped sales channel amount.");
  }

  const amountHalalas = toMoneyHalalas(payload?.amount);
  const body: CreateStoreEntryApiBody = {
    date: payload?.date,
    type: payload?.type,
    categoryId: isUuid(payload?.categoryId) ? payload.categoryId : null,
    note: typeof payload?.note === "string" ? payload.note : "",
    salesChannels: mappedSalesChannels,
  };
  if (amountHalalas > 0) {
    body.amountHalalas = amountHalalas;
  }
  if (isUuid(payload?.closeoutDbId)) {
    body.closeoutId = payload.closeoutDbId;
  }
  if (payload?.attachment && typeof payload.attachment === "object") {
    body.attachment = {
      kind: payload.attachment.kind || "image",
      name: payload.attachment.name || "attachment.jpg",
      mimeType: payload.attachment.mimeType || "image/jpeg",
      sizeBytes: Number(payload.attachment.sizeBytes || 0),
      ...(payload.attachment.storageKey
        ? { storageKey: payload.attachment.storageKey }
        : { dataUrl: payload.attachment.dataUrl || "" }),
    };
  }

  return fetchApiJsonWithPrototypeContext(`/api/v1/stores/${context.storeId}/entries`, {
    organizationId,
    actorUserId,
    actorRole,
    method: "POST",
    body,
    errorMessage: "entry create api failed",
    errorStyle: "status",
  });
}

export async function voidStoreEntryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  entry,
  reason = "",
}: EntriesApiActorParams & { entry: OperationalEntry; reason?: string }): Promise<unknown> {
  const context = resolvePrototypeApiContext({
    organizationId,
    actorUserId,
    actorRole,
    storeId: entry?.businessId,
  });
  if (!context || !isUuid(entry?.id)) return null;

  return fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${context.storeId}/entries/${encodeURIComponent(entry.id!)}/void`,
    {
      organizationId,
      actorUserId,
      actorRole,
      method: "POST",
      body: { reason },
      errorMessage: "entry void api failed",
      errorStyle: "status",
    },
  );
}

export async function restoreStoreEntryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  entry,
  reason = "",
}: EntriesApiActorParams & { entry: OperationalEntry; reason?: string }): Promise<unknown> {
  const context = resolvePrototypeApiContext({
    organizationId,
    actorUserId,
    actorRole,
    storeId: entry?.businessId,
  });
  if (!context || !isUuid(entry?.id)) return null;

  return fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${context.storeId}/entries/${encodeURIComponent(entry.id!)}/restore`,
    {
      organizationId,
      actorUserId,
      actorRole,
      method: "POST",
      body: { reason },
      errorMessage: "entry restore api failed",
      errorStyle: "status",
    },
  );
}
