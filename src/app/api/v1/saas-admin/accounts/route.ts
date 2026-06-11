import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import { getSaasAccounts } from "@/features/saas-admin/server/get-saas-accounts";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { actorUserId } = assertSaasAdminRouteReady(request);
    const { searchParams } = new URL(request.url);
    const pageRaw = Number(searchParams.get("page") || "1");
    const pageSizeRaw = Number(searchParams.get("pageSize") || "25");
    const statusRaw = searchParams.get("status") || "all";

    if (!["all", "trial", "active", "inactive", "suspended"].includes(statusRaw)) {
      throw new ValidationError("Query param 'status' is invalid.");
    }

    const result = await getSaasAccounts({
      actorUserId,
      search: searchParams.get("search") || undefined,
      status: statusRaw as "all" | "trial" | "active" | "inactive" | "suspended",
      plan: searchParams.get("plan") || undefined,
      page: Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1,
      pageSize: Number.isInteger(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 25,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
