import { fail, ok } from "@/core/http/api-response";
import { isSaasAdminApiEnabled } from "@/core/config/saas-admin-api-mode";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { listSaasOrganizationAnalytics } from "@/features/saas-admin/server/list-saas-organization-analytics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!isSaasAdminApiEnabled()) {
      throw new ServiceUnavailableError("SaaS admin API is disabled.");
    }

    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) {
      throw new ValidationError("Query params 'from' and 'to' are required (YYYY-MM-DD).");
    }

    const billingType = searchParams.get("billingType") || "all";
    const segment = searchParams.get("segment") || "all";
    const limitRaw = Number(searchParams.get("limit") || "50");

    const result = await listSaasOrganizationAnalytics({
      actorUserId: requestContext.userId!,
      from,
      to,
      billingType: billingType as "all" | "trial" | "paid" | "free" | "churned",
      segment: segment as "all" | "power" | "regular" | "intermittent" | "dormant" | "churned",
      limit: Number.isInteger(limitRaw) ? limitRaw : 50,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
