import { getSaasUsage } from "@/features/saas-admin/server/get-saas-usage";
import { withSaasAdminApiRouteNoParams } from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

export const GET = withSaasAdminApiRouteNoParams("usage:read", ({ actor, searchParams }) => {
  const monthsRaw = Number(searchParams.get("months") || "6");

  return getSaasUsage({
    actorUserId: actor.actorUserId,
    months: Number.isInteger(monthsRaw) && monthsRaw > 0 ? monthsRaw : 6,
  });
});
