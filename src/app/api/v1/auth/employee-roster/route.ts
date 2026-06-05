import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import {
  assertProductionRuntimeEnv,
  getProductionAuthRuntimeConfig,
  isServerProductionMode,
  readEnv,
} from "@/core/config/env";
import { getEmployeeLoginRoster } from "@/features/runtime-settings/server/runtime-settings-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const env = readEnv();
    if (isServerProductionMode(env)) {
      assertProductionRuntimeEnv(env);
    }
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const { organizationId } = getProductionAuthRuntimeConfig(env);
    if (!organizationId) {
      throw new ServiceUnavailableError("Organization is not configured.");
    }

    const staff = await getEmployeeLoginRoster(organizationId);
    return ok({ staff });
  } catch (error) {
    return fail(error);
  }
}
