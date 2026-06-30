import { readJsonBody } from "@/core/http/api-route-handler";
import { ValidationError } from "@/core/errors/app-error";
import { DEFAULT_PLAN_CODE, parsePlanCode } from "@/features/billing/plan-codes";
import { createSaasAccount } from "@/features/saas-admin/server/create-saas-account";
import { getSaasAccounts } from "@/features/saas-admin/server/get-saas-accounts";
import { withSaasAdminApiRouteNoParams } from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

function readRequiredString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

type Body = Record<string, unknown>;

export const GET = withSaasAdminApiRouteNoParams("accounts:read", ({ actor, searchParams }) => {
  const pageRaw = Number(searchParams.get("page") || "1");
  const pageSizeRaw = Number(searchParams.get("pageSize") || "25");
  const statusRaw = searchParams.get("status") || "all";

  if (!["all", "trial", "active", "inactive", "suspended", "archived"].includes(statusRaw)) {
    throw new ValidationError("Query param 'status' is invalid.");
  }

  return getSaasAccounts({
    actorUserId: actor.actorUserId,
    search: searchParams.get("search") || undefined,
    status: statusRaw as "all" | "trial" | "active" | "inactive" | "suspended" | "archived",
    plan: searchParams.get("plan") || undefined,
    page: Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1,
    pageSize: Number.isInteger(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : 25,
  });
});

export const POST = withSaasAdminApiRouteNoParams("accounts:write", async ({ actor, request }) => {
  const body = await readJsonBody<Body>(request);

  const planCode = body?.planCode;
  const created = await createSaasAccount({
    actorUserId: actor.actorUserId,
    organizationName: readRequiredString(body?.organizationName),
    ownerName: readRequiredString(body?.ownerName),
    ownerPhone: readRequiredString(body?.ownerPhone),
    storeName: readOptionalString(body?.storeName),
    storeLocation: readOptionalString(body?.storeLocation),
    planCode: parsePlanCode(planCode) ?? DEFAULT_PLAN_CODE,
  });

  return { data: created, init: { status: 201 } };
});
