import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import { getSaasAccountDetails } from "@/features/saas-admin/server/get-saas-account-details";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = assertSaasAdminRouteReady(request);
    const { id } = await context.params;
    if (!id) {
      throw new ValidationError("Organization id is required.");
    }

    const result = await getSaasAccountDetails({
      actorUserId,
      organizationId: id,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
