import type { PlatformSnapshot } from "@/features/saas-admin/server/platform-metrics/types";

/** Shared core metrics consumed by Overview and Investor pages — must stay identical. */
export function extractSharedCoreMetrics(snapshot: PlatformSnapshot) {
  return {
    totalAccounts: snapshot.totalAccounts.value,
    activeAccounts: snapshot.activeAccounts.value,
    storesCount: snapshot.storesCount.value,
    activeStores: snapshot.activeStoresCount.value,
    usersCount: snapshot.usersCount.value,
    closeoutsThisMonth: snapshot.closeoutsThisMonth.value,
    operationsThisMonth: snapshot.operationsThisMonth.value,
    attachmentsCount: snapshot.attachmentsCount.value,
    avgCloseoutsPerActiveStore: snapshot.derived.avgCloseoutsPerActiveStore.value,
    attachmentsPerCloseout: snapshot.derived.attachmentsPerCloseout.value,
    inactiveAccounts: snapshot.engagement.inactiveAccountsCount.value,
    estimatedMrr: snapshot.revenue.estimatedMrr.value,
    estimatedArr: snapshot.revenue.estimatedArr.value,
  };
}

export function assertSharedMetricsParity(
  overview: ReturnType<typeof extractSharedCoreMetrics>,
  investor: ReturnType<typeof extractSharedCoreMetrics>,
): void {
  const keys = Object.keys(overview) as Array<keyof typeof overview>;
  for (const key of keys) {
    if (overview[key] !== investor[key]) {
      throw new Error(`Platform metric mismatch for "${key}": overview=${overview[key]} investor=${investor[key]}`);
    }
  }
}
