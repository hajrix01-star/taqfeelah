import { readJsonBody, withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import {
  getEmployeePreferences,
  saveEmployeePreferences,
} from "@/features/runtime-settings/server/employee-preferences-service";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRouteNoParams(async ({ auth }) => {
  const preferences = await getEmployeePreferences({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
  });
  return { preferences };
});

export const PATCH = withAuthedApiRouteNoParams(async ({ auth, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);
  const preferences = body?.preferences && typeof body.preferences === "object"
    ? body.preferences
    : body;

  const saved = await saveEmployeePreferences({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    preferences,
  });

  return { preferences: saved };
});
