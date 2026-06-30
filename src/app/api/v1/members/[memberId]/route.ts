import { readJsonBody, withAuthedApiRoute } from "@/core/http/api-route-handler";
import { updateOrganizationMember } from "@/features/org-config/server/update-organization-member";

export const dynamic = "force-dynamic";

type UpdateMemberInput = Parameters<typeof updateOrganizationMember>[0];

export const PATCH = withAuthedApiRoute<{ memberId: string }>(async ({ auth, params, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);
  const storeIds = Array.isArray(body?.storeIds)
    ? body.storeIds.filter((value: unknown) => typeof value === "string")
    : undefined;
  const credentials = body?.credentials as UpdateMemberInput["credentials"];

  return updateOrganizationMember({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    memberId: params.memberId,
    name: typeof body?.name === "string" ? body.name : undefined,
    role: body?.role === "owner" || body?.role === "manager" || body?.role === "employee"
      ? body.role
      : undefined,
    status: body?.status === "active" || body?.status === "inactive" ? body.status : undefined,
    deleted: body?.deleted === true ? true : undefined,
    storeIds,
    loginPhone: typeof body?.loginPhone === "string" ? body.loginPhone : undefined,
    credentials,
    reason: typeof body?.reason === "string" ? body.reason : undefined,
  });
});
