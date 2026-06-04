import { ok, fail } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { reviewStoreCloseout } from "@/features/closeouts/server/review-store-closeout";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ storeId: string; closeoutId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();

    if (typeof body?.date !== "string" || !body.date) {
      throw new ValidationError("Body field 'date' is required.");
    }
    if (body?.action !== "approve" && body?.action !== "return") {
      throw new ValidationError("Body field 'action' must be either 'approve' or 'return'.");
    }

    const result = await reviewStoreCloseout({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      closeoutId: params.closeoutId,
      date: body.date,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      action: body.action,
      reason: typeof body?.reason === "string" ? body.reason : undefined,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
