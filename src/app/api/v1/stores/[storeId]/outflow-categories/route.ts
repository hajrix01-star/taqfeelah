import { ValidationError } from "@/core/errors/app-error";
import { withAuthedApiRoute } from "@/core/http/api-route-handler";
import { listStoreOutflowCategories } from "@/features/org-config/server/list-store-outflow-categories";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRoute<{ storeId: string }>(({ auth, params, searchParams }) => {
  const statusRaw = searchParams.get("status") || "all";
  if (statusRaw !== "active" && statusRaw !== "retired" && statusRaw !== "all") {
    throw new ValidationError("Query param 'status' must be one of: active, retired, all.");
  }

  return listStoreOutflowCategories({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    status: statusRaw,
  });
});
