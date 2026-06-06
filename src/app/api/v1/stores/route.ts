import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { createOrganizationStore } from "@/features/org-config/server/create-organization-store";
import { listOrganizationStores } from "@/features/org-config/server/list-organization-stores";

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
    if (statusRaw !== "active" && statusRaw !== "archived" && statusRaw !== "all") {
      throw new ValidationError("Query param 'status' must be one of: active, archived, all.");
    }

    const result = await listOrganizationStores({
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

    const created = await createOrganizationStore({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      name: typeof body?.name === "string" ? body.name : "",
      location: typeof body?.location === "string" ? body.location : undefined,
    });

    return ok(created, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
