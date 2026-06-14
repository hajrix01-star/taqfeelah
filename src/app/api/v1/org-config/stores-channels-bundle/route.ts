import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { getOrganizationStoresChannelsBundle } from "@/features/org-config/server/get-organization-stores-channels-bundle";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const { searchParams } = new URL(request.url);

    const storeStatusRaw = searchParams.get("storeStatus") || searchParams.get("status") || "all";
    if (storeStatusRaw !== "active" && storeStatusRaw !== "archived" && storeStatusRaw !== "all") {
      throw new ValidationError("Query param 'storeStatus' must be one of: active, archived, all.");
    }

    const channelStatusRaw = searchParams.get("channelStatus") || "all";
    if (channelStatusRaw !== "active" && channelStatusRaw !== "retired" && channelStatusRaw !== "all") {
      throw new ValidationError("Query param 'channelStatus' must be one of: active, retired, all.");
    }

    const result = await getOrganizationStoresChannelsBundle({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      storeStatus: storeStatusRaw,
      channelStatus: channelStatusRaw,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
