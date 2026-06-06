import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { acknowledgeDuplicateSummaries } from "@/features/entries/server/acknowledge-duplicate-summaries";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ storeId: string }>;
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
    const entryIds = Array.isArray(body?.entryIds)
      ? body.entryIds.filter((value: unknown) => typeof value === "string")
      : [];
    if (!entryIds.length) {
      throw new ValidationError("Body field 'entryIds' must be a non-empty array.");
    }

    const result = await acknowledgeDuplicateSummaries({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      date: typeof body?.date === "string" ? body.date : "",
      entryIds,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
