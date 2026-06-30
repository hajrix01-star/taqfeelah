import { readJsonBody, withAuthedApiRoute } from "@/core/http/api-route-handler";
import { updateOrganizationStore } from "@/features/org-config/server/update-organization-store";

export const dynamic = "force-dynamic";

export const PATCH = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);

  return updateOrganizationStore({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    name: typeof body?.name === "string" ? body.name : undefined,
    location: typeof body?.location === "string" ? body.location : undefined,
    status: body?.status === "active" || body?.status === "archived" ? body.status : undefined,
    reason: typeof body?.reason === "string" ? body.reason : undefined,
  });
});
