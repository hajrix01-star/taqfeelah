import { withAuthedApiRoute } from "@/core/http/api-route-handler";
import { deleteStoreCloseout } from "@/features/closeouts/server/delete-store-closeout";
import { publishOperationalSyncEventSafe } from "@/core/sync/publish-operational-sync-event";

export const dynamic = "force-dynamic";

export const DELETE = withAuthedApiRoute<{ storeId: string; closeoutId: string }>(async ({ auth, params }) => {
  const result = await deleteStoreCloseout({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    clientCloseoutId: params.closeoutId,
    actorUserId: auth.userId,
    actorRole: auth.role,
  });

  publishOperationalSyncEventSafe({
    type: "closeout.deleted",
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    payload: {
      closeoutId: params.closeoutId,
      date: result.date,
    },
  });

  return result;
});
