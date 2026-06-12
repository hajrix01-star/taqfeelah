import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import { createSaasAccount } from "@/features/saas-admin/server/create-saas-account";
import { getSaasAccounts } from "@/features/saas-admin/server/get-saas-accounts";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

function readRequiredString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

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

export async function POST(request: Request) {
  try {
    const { actorUserId } = assertSaasAdminRouteReady(request);
    const body = await request.json();

    const planCode = body?.planCode;
    const created = await createSaasAccount({
      actorUserId,
      organizationName: readRequiredString(body?.organizationName),
      ownerName: readRequiredString(body?.ownerName),
      ownerUsername: readRequiredString(body?.ownerUsername),
      ownerPassword: readOptionalString(body?.ownerPassword),
      ownerPhone: readOptionalString(body?.ownerPhone),
      storeName: readOptionalString(body?.storeName),
      storeLocation: readOptionalString(body?.storeLocation),
      planCode:
        planCode === "starter" || planCode === "growth" || planCode === "enterprise"
          ? planCode
          : "starter",
    });

    return ok(created, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
