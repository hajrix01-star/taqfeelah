import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { estimateRegisterExport } from "@/features/exports/server/export-jobs-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();
    const result = await estimateRegisterExport({
      organizationId: requestContext.organizationId,
      storeId: body?.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      period: body?.period,
      from: body?.from,
      to: body?.to,
      date: body?.date,
      month: body?.month,
      format: body?.format,
    });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
