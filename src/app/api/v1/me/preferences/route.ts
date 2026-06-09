import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv, assertProductionRuntimeEnv, isServerProductionMode } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import {
  getEmployeePreferences,
  saveEmployeePreferences,
} from "@/features/runtime-settings/server/employee-preferences-service";

export const dynamic = "force-dynamic";

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
    const preferences = await getEmployeePreferences({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
    });
    return ok({ preferences });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const env = readEnv();
    if (isServerProductionMode(env)) {
      assertProductionRuntimeEnv(env);
    }
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();
    const preferences = body?.preferences && typeof body.preferences === "object"
      ? body.preferences
      : body;

    const saved = await saveEmployeePreferences({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      preferences,
    });

    return ok({ preferences: saved });
  } catch (error) {
    return fail(error);
  }
}
