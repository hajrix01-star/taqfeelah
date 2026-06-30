import {
  parseEnumQuery,
  parsePositiveIntQuery,
  readJsonBody,
  withAuthedApiRoute,
} from "@/core/http/api-route-handler";
import { createStoreEntry } from "@/features/entries/server/create-store-entry";
import { listStoreEntries } from "@/features/entries/server/list-store-entries";
import { publishOperationalSyncEventSafe } from "@/core/sync/publish-operational-sync-event";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRoute<{ storeId: string }>(
  async ({ auth, params, searchParams }) => {
    const statusRaw = parseEnumQuery(searchParams, "status", ["active", "voided", "all"], "all");
    const parsedLimit = parsePositiveIntQuery(searchParams, "limit", { max: 100 });
    const cursor = searchParams.get("cursor") || undefined;

    return listStoreEntries({
      organizationId: auth.organizationId,
      storeId: params.storeId,
      actorUserId: auth.userId,
      actorRole: auth.role,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      status: statusRaw,
      limit: parsedLimit ?? 50,
      cursor,
      paginated: true,
    });
  },
);

export const POST = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, request }) => {
  const body = await readJsonBody(request);

  const result = await createStoreEntry({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    date: body?.date,
    type: body?.type,
    amountHalalas: body?.amountHalalas,
    categoryId: body?.categoryId,
    note: body?.note,
    closeoutId: body?.closeoutId,
    salesChannels: Array.isArray(body?.salesChannels) ? body.salesChannels : [],
    attachment: body?.attachment,
  });

  publishOperationalSyncEventSafe({
    type: "entry.created",
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    payload: {
      entryId: result.id,
      date: result.date,
      entryType: result.type,
    },
  });

  return { data: result, init: { status: 201 } };
});
