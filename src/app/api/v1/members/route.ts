import { readJsonBody, parseEnumQuery, withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { createOrganizationMember } from "@/features/org-config/server/create-organization-member";
import { listOrganizationMembers } from "@/features/org-config/server/list-organization-members";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRouteNoParams(async ({ auth, searchParams }) => {
  const statusRaw = parseEnumQuery(searchParams, "status", ["active", "inactive", "all"], "active");

  return listOrganizationMembers({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    status: statusRaw,
  });
});

export const POST = withAuthedApiRouteNoParams(async ({ auth, request }) => {
  const body = await readJsonBody(request);
  const storeIds = Array.isArray(body?.storeIds)
    ? body.storeIds.filter((value: unknown) => typeof value === "string")
    : [];

  const created = await createOrganizationMember({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    name: typeof body?.name === "string" ? body.name : "",
    role: body?.role === "owner" || body?.role === "manager" || body?.role === "employee"
      ? body.role
      : "employee",
    storeIds,
    loginPhone: typeof body?.loginPhone === "string" ? body.loginPhone : undefined,
    credentials: body?.credentials,
  });

  return { data: created, init: { status: 201 } };
});
