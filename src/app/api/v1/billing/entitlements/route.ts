import { fail, ok } from "@/core/http/api-response";
import { resolveRequestContext } from "@/core/auth/request-context";
import { resolveOrganizationEntitlements } from "@/features/billing/server/resolve-organization-entitlements";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const context = resolveRequestContext(request, { requireUser: true });
    const entitlements = await resolveOrganizationEntitlements(context.organizationId);
    return ok(entitlements);
  } catch (error) {
    return fail(error);
  }
}
