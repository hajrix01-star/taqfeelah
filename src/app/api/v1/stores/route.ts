import { readJsonBody, parseEnumQuery, withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { createOrganizationStore } from "@/features/org-config/server/create-organization-store";
import { listOrganizationStores } from "@/features/org-config/server/list-organization-stores";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRouteNoParams(async ({ auth, searchParams }) => {
  const statusRaw = parseEnumQuery(searchParams, "status", ["active", "archived", "all"], "active");

  return listOrganizationStores({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    status: statusRaw,
  });
});

export const POST = withAuthedApiRouteNoParams(async ({ auth, request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);

  const created = await createOrganizationStore({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    name: typeof body?.name === "string" ? body.name : "",
    location: typeof body?.location === "string" ? body.location : undefined,
  });

  return { data: created, init: { status: 201 } };
});
