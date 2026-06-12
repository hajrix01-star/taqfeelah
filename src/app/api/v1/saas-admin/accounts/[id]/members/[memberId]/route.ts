import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import { updateSaasAccountMember } from "@/features/saas-admin/server/update-saas-account-member";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string; memberId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request, "accounts:members:write");
    const { id, memberId } = await context.params;
    if (!id?.trim() || !memberId?.trim()) {
      throw new ValidationError("Organization id and member id are required.");
    }

    const body = await request.json();
    const storeIds = Array.isArray(body?.storeIds)
      ? body.storeIds.filter((value: unknown) => typeof value === "string")
      : undefined;

    const updated = await updateSaasAccountMember({
      actorUserId,
      organizationId: id.trim(),
      memberId: memberId.trim(),
      name: typeof body?.name === "string" ? body.name : undefined,
      role: body?.role === "manager" || body?.role === "employee" ? body.role : undefined,
      status: body?.status === "active" || body?.status === "inactive" ? body.status : undefined,
      pin: typeof body?.pin === "string" ? body.pin : undefined,
      loginPhone: typeof body?.loginPhone === "string" ? body.loginPhone : undefined,
      storeIds,
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
