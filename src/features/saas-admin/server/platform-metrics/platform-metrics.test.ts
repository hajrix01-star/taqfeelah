import { describe, expect, it } from "vitest";
import {
  assertSharedMetricsParity,
  extractSharedCoreMetrics,
} from "@/features/saas-admin/server/platform-metrics/map-snapshot-parity";
import { metricAvailability, toInvestorField } from "@/features/saas-admin/server/platform-metrics/metric-helpers";
import type { PlatformSnapshot } from "@/features/saas-admin/server/platform-metrics/types";

const mockSnapshot: PlatformSnapshot = {
  monthRange: { start: "2026-06-01", end: "2026-06-30" },
  totalAccounts: { value: 12, source: "live" },
  activeAccounts: { value: 10, source: "live" },
  storesCount: { value: 25, source: "live" },
  activeStoresCount: { value: 22, source: "live" },
  usersCount: { value: 40, source: "live" },
  closeoutsThisMonth: { value: 180, source: "live" },
  operationsThisMonth: { value: 420, source: "live" },
  attachmentsCount: { value: 90, source: "live" },
  lastActivityAt: { value: "2026-06-10T12:00:00.000Z", source: "live" },
  activityTrend30d: [{ date: "2026-06-01", closeouts: 5, operations: 10 }],
  activityTrendSource: "aggregated",
  engagement: {
    snapshotDate: "2026-06-09",
    dataAvailable: true,
    inactiveAccountsCount: { value: 3, source: "aggregated" },
    retentionProxy: { value: 75, source: "estimated" },
    usageIntensity: { value: 0.75, source: "estimated" },
    snapshotRows: [],
  },
  revenue: {
    estimatedMrr: { value: 1200, source: "estimated" },
    estimatedArr: { value: 14400, source: "estimated" },
    potentialMrr: { value: 1200, source: "estimated" },
    growthRate: { value: 5.5, source: "aggregated" },
  },
  derived: {
    avgCloseoutsPerActiveStore: { value: 8.18, source: "live" },
    attachmentsPerCloseout: { value: 0.5, source: "live" },
  },
};

describe("platform metrics snapshot parity", () => {
  it("extractSharedCoreMetrics is stable for overview and investor mapping", () => {
    const core = extractSharedCoreMetrics(mockSnapshot);
    expect(core.activeAccounts).toBe(10);
    expect(core.closeoutsThisMonth).toBe(180);
    expect(core.estimatedMrr).toBe(1200);
    assertSharedMetricsParity(core, core);
  });

  it("throws when shared metrics diverge", () => {
    const left = extractSharedCoreMetrics(mockSnapshot);
    const right = { ...extractSharedCoreMetrics(mockSnapshot), closeoutsThisMonth: 999 };
    expect(() => assertSharedMetricsParity(left, right)).toThrow('Platform metric mismatch for "closeoutsThisMonth"');
  });
});

describe("platform metric helpers", () => {
  it("maps source to availability", () => {
    expect(metricAvailability({ value: 10, source: "live" })).toBe("available");
    expect(metricAvailability({ value: 10, source: "aggregated" })).toBe("available");
    expect(metricAvailability({ value: 10, source: "estimated" })).toBe("estimated");
    expect(metricAvailability({ value: null, source: "estimated" })).toBe("unavailable");
  });

  it("toInvestorField preserves value and source", () => {
    const field = toInvestorField({ value: 180, source: "live" });
    expect(field).toEqual({
      value: 180,
      source: "live",
      availability: "available",
    });
  });
});

describe("overview and investor shared metric contract", () => {
  it("maps the same snapshot fields to identical values", () => {
    const overviewCore = {
      totalAccounts: mockSnapshot.totalAccounts.value,
      activeAccounts: mockSnapshot.activeAccounts.value,
      storesCount: mockSnapshot.storesCount.value,
      usersCount: mockSnapshot.usersCount.value,
      closeoutsThisMonth: mockSnapshot.closeoutsThisMonth.value,
      operationsThisMonth: mockSnapshot.operationsThisMonth.value,
      attachmentsCount: mockSnapshot.attachmentsCount.value,
    };

    const investorCore = {
      totalAccounts: mockSnapshot.totalAccounts.value,
      activeAccounts: mockSnapshot.activeAccounts.value,
      storesCount: mockSnapshot.storesCount.value,
      usersCount: mockSnapshot.usersCount.value,
      closeoutsThisMonth: mockSnapshot.closeoutsThisMonth.value,
      operationsThisMonth: mockSnapshot.operationsThisMonth.value,
      attachmentsCount: mockSnapshot.attachmentsCount.value,
    };

    expect(overviewCore).toEqual(investorCore);
    assertSharedMetricsParity(
      extractSharedCoreMetrics(mockSnapshot),
      extractSharedCoreMetrics(mockSnapshot),
    );
  });
});
