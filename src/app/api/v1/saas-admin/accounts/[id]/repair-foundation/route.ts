import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import { repairSaasAccountFoundation } from "@/features/saas-admin/server/repair-saas-account-foundation";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { actorUserId } = assertSaasAdminRouteReady(_request);
    const { id } = await context.params;
    if (!id?.trim()) {
      throw new ValidationError("Organization id is required.");
    }

    const result = await repairSaasAccountFoundation({
      actorUserId,
      organizationId: id.trim(),
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
