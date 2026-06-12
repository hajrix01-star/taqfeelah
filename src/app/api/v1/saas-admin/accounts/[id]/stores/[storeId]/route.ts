import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import { updateSaasAccountStore } from "@/features/saas-admin/server/update-saas-account-store";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string; storeId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request, "accounts:write");
    const { id, storeId } = await context.params;
    if (!id?.trim() || !storeId?.trim()) {
      throw new ValidationError("Organization id and store id are required.");
    }

    const body = await request.json();
    const updated = await updateSaasAccountStore({
      actorUserId,
      organizationId: id.trim(),
      storeId: storeId.trim(),
      name: typeof body?.name === "string" ? body.name : undefined,
      location: typeof body?.location === "string" ? body.location : undefined,
      status: body?.status === "active" || body?.status === "archived" ? body.status : undefined,
      reason: typeof body?.reason === "string" ? body.reason : undefined,
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
