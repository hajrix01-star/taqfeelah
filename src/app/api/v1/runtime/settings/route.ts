import { readJsonBody, withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import {
  getRuntimeSettings,
  saveRuntimeSettings,
} from "@/features/runtime-settings/server/runtime-settings-service";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRouteNoParams(({ auth }) =>
  getRuntimeSettings({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
  })
);

export const PUT = withAuthedApiRouteNoParams(async ({ auth, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);
  const settings =
    body?.settings && typeof body.settings === "object"
      ? (body.settings as Record<string, unknown>)
      : {};
  const reason = typeof body?.reason === "string" ? body.reason : undefined;

  const saved = await saveRuntimeSettings({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    settings,
    reason,
  });

  return {
    id: saved.id,
    createdAt: saved.createdAt,
    settings: saved.settings,
  };
});
