import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import { updateSaasAccountOwner } from "@/features/saas-admin/server/update-saas-account-owner";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request, "accounts:write");
    const { id } = await context.params;
    if (!id?.trim()) {
      throw new ValidationError("Organization id is required.");
    }

    const body = await request.json();
    const updated = await updateSaasAccountOwner({
      actorUserId,
      organizationId: id.trim(),
      ownerName: typeof body?.ownerName === "string" ? body.ownerName : undefined,
      ownerUsername: typeof body?.ownerUsername === "string" ? body.ownerUsername : undefined,
      ownerPassword: typeof body?.ownerPassword === "string" ? body.ownerPassword : undefined,
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
