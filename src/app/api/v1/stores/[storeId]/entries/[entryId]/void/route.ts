import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { voidStoreEntry } from "@/features/entries/server/void-store-entry";
import { publishOperationalSyncEventSafe } from "@/core/sync/publish-operational-sync-event";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ storeId: string; entryId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();

    const result = await voidStoreEntry({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      entryId: params.entryId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      reason: typeof body?.reason === "string" ? body.reason : undefined,
    });

    publishOperationalSyncEventSafe({
      type: "entry.voided",
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      payload: {
        entryId: params.entryId,
      },
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
