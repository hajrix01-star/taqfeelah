import { readJsonBody } from "@/core/http/api-route-handler";
import { ValidationError } from "@/core/errors/app-error";
import {
  listPlanCatalogRows,
  upsertPlanCatalogRow,
} from "@/features/billing/server/plan-catalog-repository";
import { parsePlanCode } from "@/features/billing/plan-codes";
import type { PlanCatalogRow } from "@/features/billing/types";
import { withSaasAdminApiRouteNoParams } from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

export const GET = withSaasAdminApiRouteNoParams("plans:read", async () => {
  const plans = await listPlanCatalogRows();
  return { plans };
});

export const PATCH = withSaasAdminApiRouteNoParams("plans:write", async ({ request }) => {
  const body = await readJsonBody<Record<string, unknown>>(request);
  const planCode = parsePlanCode(body?.planCode);
  if (!planCode) {
    throw new ValidationError("planCode must be trial, starter, growth, or enterprise.");
  }

  const row: PlanCatalogRow = {
    planCode,
    displayNameAr: String(body?.displayNameAr || ""),
    displayNameEn: String(body?.displayNameEn || ""),
    priceMonthlyHalalas: Number(body?.priceMonthlyHalalas ?? 0),
    priceYearlyHalalas: body?.priceYearlyHalalas == null ? null : Number(body.priceYearlyHalalas),
    maxStores: Number(body?.maxStores ?? 1),
    maxEmployees: Number(body?.maxEmployees ?? 1),
    trialDays: Number(body?.trialDays ?? 14),
    features: typeof body?.features === "object" && body.features
      ? (body.features as Record<string, unknown>)
      : {},
    isActive: body?.isActive !== false,
    sortOrder: Number(body?.sortOrder ?? 0),
  };

  if (!row.displayNameAr || !row.displayNameEn) {
    throw new ValidationError("displayNameAr and displayNameEn are required.");
  }

  const saved = await upsertPlanCatalogRow(row);
  return { plan: saved };
});
