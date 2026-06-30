import { ValidationError } from "@/core/errors/app-error";
import {
  parsePositiveIntQuery,
  readJsonBody,
  withAuthedApiRoute,
} from "@/core/http/api-route-handler";
import { listStoreCloseouts } from "@/features/closeouts/server/list-store-closeouts";
import { resolveSubmitCloseoutId } from "@/features/closeouts/server/resolve-submit-closeout-id";
import { normalizeCloseoutSubmitMode } from "@/features/closeouts/closeout-submit-mode";
import { submitStoreCloseout } from "@/features/closeouts/server/submit-store-closeout";
import { publishOperationalSyncEventSafe } from "@/core/sync/publish-operational-sync-event";

export const dynamic = "force-dynamic";

export const POST = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);
  const mode = normalizeCloseoutSubmitMode(body?.mode);
  const closeoutId = resolveSubmitCloseoutId(body?.closeoutId);

  if (typeof body?.date !== "string" || !body.date) {
    throw new ValidationError("Body field 'date' is required.");
  }

  const result = await submitStoreCloseout({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    date: body.date,
    actorUserId: auth.userId,
    actorRole: auth.role,
    closeoutId,
    mode,
    salesChannels: Array.isArray(body?.salesChannels) ? body.salesChannels : [],
    outflows: Array.isArray(body?.outflows) ? body.outflows : [],
    attachments: Array.isArray(body?.attachments) ? body.attachments : [],
    note: typeof body?.note === "string" ? body.note : undefined,
  });

  publishOperationalSyncEventSafe({
    type: "closeout.submitted",
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    payload: {
      closeoutId: result.closeoutId,
      date: result.date,
      mode,
    },
  });

  return { data: result, init: { status: 201 } };
});

export const GET = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, searchParams }) => {
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const parsedLimit = parsePositiveIntQuery(searchParams, "limit");
  const cursor = searchParams.get("cursor") || undefined;
  const paginated = searchParams.get("paginated") === "1" || Boolean(cursor);

  const result = await listStoreCloseouts({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    dateFrom,
    dateTo,
    limit: parsedLimit ?? (paginated ? 50 : 200),
    cursor,
    paginated,
  });

  if (paginated) {
    return result;
  }

  return result.items;
});
