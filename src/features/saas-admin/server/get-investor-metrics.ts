import { z } from "zod";
import { ValidationError } from "@/core/errors/app-error";
import type { InvestorMetrics } from "@/features/saas-admin/types";
import { getPlatformSnapshot } from "@/features/saas-admin/server/platform-metrics";
import { toInvestorField } from "@/features/saas-admin/server/platform-metrics/metric-helpers";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
});

export async function getInvestorMetrics(
  rawInput: z.infer<typeof inputSchema>,
): Promise<InvestorMetrics> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid investor metrics input.", parsed.error.flatten());
  }
  const snapshot = await getPlatformSnapshot();

  return {
    activeAccounts: toInvestorField(snapshot.activeAccounts),
    activeStores: toInvestorField(snapshot.activeStoresCount),
    monthlyCloseouts: toInvestorField(snapshot.closeoutsThisMonth),
    monthlyOperations: toInvestorField(snapshot.operationsThisMonth),
    avgCloseoutsPerStore: toInvestorField(snapshot.derived.avgCloseoutsPerActiveStore),
    attachmentsPerCloseout: toInvestorField(snapshot.derived.attachmentsPerCloseout),
    estimatedMrr: toInvestorField(snapshot.revenue.estimatedMrr, "Estimated MRR"),
    estimatedArr: toInvestorField(snapshot.revenue.estimatedArr, "Estimated ARR"),
    potentialMrr: toInvestorField(snapshot.revenue.potentialMrr, "Potential MRR"),
    growthRate: toInvestorField(snapshot.revenue.growthRate),
    inactiveAccounts: toInvestorField(snapshot.engagement.inactiveAccountsCount),
    retentionProxy: toInvestorField(snapshot.engagement.retentionProxy),
    usageIntensity: toInvestorField(snapshot.engagement.usageIntensity),
    currency: "SAR",
  };
}
