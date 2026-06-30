import { withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { ForbiddenError } from "@/core/errors/app-error";
import { getEmployeeLoginRoster } from "@/features/runtime-settings/server/runtime-settings-service";

export const dynamic = "force-dynamic";

const ROSTER_ROLES = new Set(["owner", "manager", "employee"]);

export const GET = withAuthedApiRouteNoParams(async ({ auth }) => {
  if (!ROSTER_ROLES.has(auth.role)) {
    throw new ForbiddenError("Not authorized to view employee roster.");
  }

  const staff = await getEmployeeLoginRoster(auth.organizationId);
  return { staff };
});
