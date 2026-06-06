import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { listStoreOutflowCategories } from "@/features/org-config/server/list-store-outflow-categories";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ storeId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const { searchParams } = new URL(request.url);
    const statusRaw = searchParams.get("status") || "all";
    if (statusRaw !== "active" && statusRaw !== "retired" && statusRaw !== "all") {
      throw new ValidationError("Query param 'status' must be one of: active, retired, all.");
    }

    const result = await listStoreOutflowCategories({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      status: statusRaw,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
