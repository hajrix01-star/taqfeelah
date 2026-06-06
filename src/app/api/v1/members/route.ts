import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { listOrganizationMembers } from "@/features/org-config/server/list-organization-members";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const { searchParams } = new URL(request.url);
    const statusRaw = searchParams.get("status") || "active";
    if (statusRaw !== "active" && statusRaw !== "inactive" && statusRaw !== "all") {
      throw new ValidationError("Query param 'status' must be one of: active, inactive, all.");
    }

    const result = await listOrganizationMembers({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      status: statusRaw,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
