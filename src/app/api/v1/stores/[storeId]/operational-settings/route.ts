import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { storeOperationalSettingsPatchSchema } from "@/domain/store-operational-settings/schema";
import {
  getStoreOperationalSettings,
  updateStoreOperationalSettings,
} from "@/features/org-config/server/update-store-operational-settings";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ storeId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });

    const result = await getStoreOperationalSettings({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ValidationError("Request body must be an object.");
    }

    const {
      activeCategories,
      employeeHistoryVisibility,
      closeoutAlert,
      notebookTheme,
      reason,
    } = body as Record<string, unknown>;

    const patchCandidate = {
      ...(activeCategories !== undefined ? { activeCategories } : {}),
      ...(employeeHistoryVisibility !== undefined ? { employeeHistoryVisibility } : {}),
      ...(closeoutAlert !== undefined ? { closeoutAlert } : {}),
      ...(notebookTheme !== undefined ? { notebookTheme } : {}),
    };
    const parsedPatch = storeOperationalSettingsPatchSchema.safeParse(patchCandidate);
    if (!parsedPatch.success) {
      throw new ValidationError("Invalid operational settings patch.", parsedPatch.error.flatten());
    }

    const result = await updateStoreOperationalSettings({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      patch: parsedPatch.data,
      reason: typeof reason === "string" ? reason : undefined,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
