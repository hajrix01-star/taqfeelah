import { readJsonBody, withAuthedApiRoute } from "@/core/http/api-route-handler";
import { voidStoreEntry } from "@/features/entries/server/void-store-entry";
import { publishOperationalSyncEventSafe } from "@/core/sync/publish-operational-sync-event";

export const dynamic = "force-dynamic";

export const POST = withAuthedApiRoute<{ storeId: string; entryId: string }>(async ({ auth, params, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);

  const result = await voidStoreEntry({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    entryId: params.entryId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    reason: typeof body?.reason === "string" ? body.reason : undefined,
  });

  publishOperationalSyncEventSafe({
    type: "entry.voided",
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    payload: {
      entryId: params.entryId,
    },
  });

  return result;
});
