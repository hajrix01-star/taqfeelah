import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv, assertProductionRuntimeEnv, isServerProductionMode } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import {
  getRuntimeSettings,
  saveRuntimeSettings,
} from "@/features/runtime-settings/server/runtime-settings-service";

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
    const result = await getRuntimeSettings({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
    });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
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
    const settings = body?.settings && typeof body.settings === "object" ? body.settings : {};
    const reason = typeof body?.reason === "string" ? body.reason : undefined;

    const saved = await saveRuntimeSettings({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      settings,
      reason,
    });

    return ok(saved);
  } catch (error) {
    return fail(error);
  }
}
