import { fail, ok } from "@/core/http/api-response";
import { isSaasAdminApiEnabled } from "@/core/config/saas-admin-api-mode";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import { aggregateSaasAnalytics } from "@/features/saas-admin/server/aggregate-saas-analytics";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!isSaasAdminApiEnabled()) {
      throw new ServiceUnavailableError("SaaS admin API is disabled.");
    }

    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    assertPlatformAdminAccess({ actorUserId: requestContext.userId! });

    let snapshotDate: string | undefined;
    try {
      const body = await request.json() as { snapshotDate?: string };
      if (typeof body?.snapshotDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.snapshotDate)) {
        snapshotDate = body.snapshotDate;
      }
    } catch {
      snapshotDate = undefined;
    }

    const result = await aggregateSaasAnalytics(snapshotDate);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
