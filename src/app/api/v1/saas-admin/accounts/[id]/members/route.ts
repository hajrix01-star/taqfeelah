import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import { createSaasAccountMember } from "@/features/saas-admin/server/create-saas-account-member";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = assertSaasAdminRouteReady(request);
    const { id: organizationId } = await context.params;
    if (!organizationId?.trim()) {
      throw new ValidationError("Organization id is required.");
    }

    const body = await request.json();
    const storeIds = Array.isArray(body?.storeIds)
      ? body.storeIds.filter((value: unknown) => typeof value === "string")
      : [];

    const created = await createSaasAccountMember({
      actorUserId,
      organizationId: organizationId.trim(),
      name: typeof body?.name === "string" ? body.name : "",
      role: body?.role === "manager" || body?.role === "employee" ? body.role : "employee",
      pin: typeof body?.pin === "string" ? body.pin : "",
      storeIds,
    });

    return ok(created, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
