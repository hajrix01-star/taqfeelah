import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { updateOrganizationMember } from "@/features/org-config/server/update-organization-member";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ memberId: string }>;
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
    const storeIds = Array.isArray(body?.storeIds)
      ? body.storeIds.filter((value: unknown) => typeof value === "string")
      : undefined;

    const updated = await updateOrganizationMember({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      memberId: params.memberId,
      name: typeof body?.name === "string" ? body.name : undefined,
      role: body?.role === "owner" || body?.role === "manager" || body?.role === "employee"
        ? body.role
        : undefined,
      status: body?.status === "active" || body?.status === "inactive" ? body.status : undefined,
      storeIds,
      loginPhone: typeof body?.loginPhone === "string" ? body.loginPhone : undefined,
      credentials: body?.credentials,
      reason: typeof body?.reason === "string" ? body.reason : undefined,
    });

    return ok(updated);
  } catch (error) {
    return fail(error);
  }
}
