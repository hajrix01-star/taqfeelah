import { ok, fail } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { deleteStoreCloseout } from "@/features/closeouts/server/delete-store-closeout";
import { publishOperationalSyncEventSafe } from "@/core/sync/publish-operational-sync-event";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ storeId: string; closeoutId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });

    const result = await deleteStoreCloseout({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      clientCloseoutId: params.closeoutId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
    });

    publishOperationalSyncEventSafe({
      type: "closeout.deleted",
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      payload: {
        closeoutId: params.closeoutId,
        date: result.date,
      },
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
