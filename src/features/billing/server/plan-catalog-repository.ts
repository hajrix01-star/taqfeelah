import { asc, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { planCatalog } from "@/core/db/schema";
import type { PlanCatalogRow, PlanCode } from "@/features/billing/types";

const FALLBACK_PLANS: PlanCatalogRow[] = [
  {
    planCode: "starter",
    displayNameAr: "أساسية",
    displayNameEn: "Starter",
    priceMonthlyHalalas: 9_900,
    priceYearlyHalalas: 99_000,
    maxStores: 1,
    maxEmployees: 5,
    trialDays: 14,
    features: {},
    isActive: true,
    sortOrder: 1,
  },
  {
    planCode: "growth",
    displayNameAr: "نمو",
    displayNameEn: "Growth",
    priceMonthlyHalalas: 29_900,
    priceYearlyHalalas: 299_000,
    maxStores: 3,
    maxEmployees: 20,
    trialDays: 14,
    features: { multiStore: true },
    isActive: true,
    sortOrder: 2,
  },
  {
    planCode: "enterprise",
    displayNameAr: "مؤسسات",
    displayNameEn: "Enterprise",
    priceMonthlyHalalas: 0,
    priceYearlyHalalas: null,
    maxStores: 99,
    maxEmployees: 999,
    trialDays: 30,
    features: { multiStore: true, customContract: true },
    isActive: true,
    sortOrder: 3,
  },
];

function mapRow(row: typeof planCatalog.$inferSelect): PlanCatalogRow {
  return {
    planCode: row.planCode as PlanCode,
    displayNameAr: row.displayNameAr,
    displayNameEn: row.displayNameEn,
    priceMonthlyHalalas: row.priceMonthlyHalalas,
    priceYearlyHalalas: row.priceYearlyHalalas,
    maxStores: row.maxStores,
    maxEmployees: row.maxEmployees,
    trialDays: row.trialDays,
    features: (row.features as Record<string, unknown>) ?? {},
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

export async function listPlanCatalogRows(): Promise<PlanCatalogRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(planCatalog)
    .orderBy(asc(planCatalog.sortOrder));

  if (!rows.length) return FALLBACK_PLANS;
  return rows.map(mapRow);
}

export async function getPlanCatalogRow(planCode: string): Promise<PlanCatalogRow | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(planCatalog)
    .where(eq(planCatalog.planCode, planCode))
    .limit(1);

  if (row) return mapRow(row);
  return FALLBACK_PLANS.find((plan) => plan.planCode === planCode) ?? null;
}

export async function upsertPlanCatalogRow(
  input: PlanCatalogRow,
  executor?: Pick<ReturnType<typeof getDb>, "insert" | "update">,
): Promise<PlanCatalogRow> {
  const db = executor ?? getDb();
  const now = new Date();

  await db
    .insert(planCatalog)
    .values({
      planCode: input.planCode,
      displayNameAr: input.displayNameAr,
      displayNameEn: input.displayNameEn,
      priceMonthlyHalalas: input.priceMonthlyHalalas,
      priceYearlyHalalas: input.priceYearlyHalalas,
      maxStores: input.maxStores,
      maxEmployees: input.maxEmployees,
      trialDays: input.trialDays,
      features: input.features,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: planCatalog.planCode,
      set: {
        displayNameAr: input.displayNameAr,
        displayNameEn: input.displayNameEn,
        priceMonthlyHalalas: input.priceMonthlyHalalas,
        priceYearlyHalalas: input.priceYearlyHalalas,
        maxStores: input.maxStores,
        maxEmployees: input.maxEmployees,
        trialDays: input.trialDays,
        features: input.features,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
        updatedAt: now,
      },
    });

  const saved = await getPlanCatalogRow(input.planCode);
  if (!saved) throw new Error("Failed to persist plan catalog row.");
  return saved;
}
