import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { createOrganizationMember } from "@/features/org-config/server/create-organization-member";
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

export async function POST(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();
    const storeIds = Array.isArray(body?.storeIds)
      ? body.storeIds.filter((value: unknown) => typeof value === "string")
      : [];

    const created = await createOrganizationMember({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      name: typeof body?.name === "string" ? body.name : "",
      role: body?.role === "owner" || body?.role === "manager" || body?.role === "employee"
        ? body.role
        : "employee",
      storeIds,
      loginPhone: typeof body?.loginPhone === "string" ? body.loginPhone : undefined,
      credentials: body?.credentials,
    });

    return ok(created, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
