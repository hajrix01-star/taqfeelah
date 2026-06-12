import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import { getSaasAccountDetails } from "@/features/saas-admin/server/get-saas-account-details";
import { updateSaasAccount } from "@/features/saas-admin/server/update-saas-account";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request);
    const { id } = await context.params;
    if (!id?.trim()) {
      throw new ValidationError("Organization id is required.");
    }

    const result = await getSaasAccountDetails({
      actorUserId,
      organizationId: id.trim(),
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request);
    const { id } = await context.params;
    if (!id?.trim()) {
      throw new ValidationError("Organization id is required.");
    }

    const body = await request.json();
    const planCode = body?.planCode;
    const updated = await updateSaasAccount({
      actorUserId,
      organizationId: id.trim(),
      name: typeof body?.organizationName === "string" ? body.organizationName : undefined,
      status: body?.status === "active" || body?.status === "suspended" ? body.status : undefined,
      planCode: planCode === "starter" || planCode === "growth" || planCode === "enterprise"
        ? planCode
        : undefined,
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
