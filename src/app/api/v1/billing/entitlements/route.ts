import { withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { resolveOrganizationEntitlements } from "@/features/billing/server/resolve-organization-entitlements";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRouteNoParams(({ auth }) =>
  resolveOrganizationEntitlements(auth.organizationId)
);
