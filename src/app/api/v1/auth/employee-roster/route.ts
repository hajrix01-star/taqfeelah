import { fail, ok } from "@/core/http/api-response";
import { ForbiddenError, ServiceUnavailableError } from "@/core/errors/app-error";
import { resolveRequestContext } from "@/core/auth/request-context";
import {
  assertProductionRuntimeEnv,
  isServerProductionMode,
  readEnv,
} from "@/core/config/env";
import { getEmployeeLoginRoster } from "@/features/runtime-settings/server/runtime-settings-service";

export const dynamic = "force-dynamic";

const ROSTER_ROLES = new Set(["owner", "manager", "employee"]);

export async function GET(request: Request) {
  try {
    const env = readEnv();
    if (isServerProductionMode(env)) {
      assertProductionRuntimeEnv(env);
    }
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    if (!requestContext.role || !ROSTER_ROLES.has(requestContext.role)) {
      throw new ForbiddenError("Not authorized to view employee roster.");
    }

    const staff = await getEmployeeLoginRoster(requestContext.organizationId);
    return ok({ staff });
  } catch (error) {
    return fail(error);
  }
}
