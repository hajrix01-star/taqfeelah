import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { updateOrganizationStore } from "@/features/org-config/server/update-organization-store";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ storeId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();

    const updated = await updateOrganizationStore({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
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
