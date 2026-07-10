import { ValidationError } from "@/core/errors/app-error";
import { readJsonBody, withAuthedApiRoute } from "@/core/http/api-route-handler";
import { storeOperationalSettingsPatchSchema } from "@/domain/store-operational-settings/schema";
import {
  getStoreOperationalSettings,
  updateStoreOperationalSettings,
} from "@/features/org-config/server/update-store-operational-settings";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRoute<{ storeId: string }>(({ auth, params }) =>
  getStoreOperationalSettings({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
  })
);

export const PATCH = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be an object.");
  }

  const {
    activeCategories,
    employeeHistoryVisibility,
    closeoutAlert,
    notebookTheme,
    dailySalesTarget,
    reason,
  } = body;

  const patchCandidate = {
    ...(activeCategories !== undefined ? { activeCategories } : {}),
    ...(employeeHistoryVisibility !== undefined ? { employeeHistoryVisibility } : {}),
    ...(closeoutAlert !== undefined ? { closeoutAlert } : {}),
    ...(notebookTheme !== undefined ? { notebookTheme } : {}),
    ...(dailySalesTarget !== undefined ? { dailySalesTarget } : {}),
  };
  const parsedPatch = storeOperationalSettingsPatchSchema.safeParse(patchCandidate);
  if (!parsedPatch.success) {
    throw new ValidationError("Invalid operational settings patch.", parsedPatch.error.flatten());
  }

  return updateStoreOperationalSettings({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    patch: parsedPatch.data,
    reason: typeof reason === "string" ? reason : undefined,
  });
});
