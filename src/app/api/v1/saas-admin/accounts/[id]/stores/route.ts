import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import { createSaasAccountStore } from "@/features/saas-admin/server/create-saas-account-store";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request, "accounts:write");
    const { id: organizationId } = await context.params;
    if (!organizationId?.trim()) {
      throw new ValidationError("Organization id is required.");
    }

    const body = await request.json();
    const created = await createSaasAccountStore({
      actorUserId,
      organizationId: organizationId.trim(),
      name: typeof body?.name === "string" ? body.name : "",
      location: typeof body?.location === "string" ? body.location : undefined,
    });

    return ok(created, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
