import { ValidationError } from "@/core/errors/app-error";
import { withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { getOrganizationStoresChannelsBundle } from "@/features/org-config/server/get-organization-stores-channels-bundle";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRouteNoParams(({ auth, searchParams }) => {
  const storeStatusRaw = searchParams.get("storeStatus") || searchParams.get("status") || "all";
  if (storeStatusRaw !== "active" && storeStatusRaw !== "archived" && storeStatusRaw !== "all") {
    throw new ValidationError("Query param 'storeStatus' must be one of: active, archived, all.");
  }

  const channelStatusRaw = searchParams.get("channelStatus") || "all";
  if (channelStatusRaw !== "active" && channelStatusRaw !== "retired" && channelStatusRaw !== "all") {
    throw new ValidationError("Query param 'channelStatus' must be one of: active, retired, all.");
  }

  return getOrganizationStoresChannelsBundle({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    storeStatus: storeStatusRaw,
    channelStatus: channelStatusRaw,
  });
});
