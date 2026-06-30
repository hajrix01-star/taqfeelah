import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

const periodTotals = [{ salesHalalas: 200000, outflowHalalas: 25000 }];
const attachmentStats = [{ attachmentCount: 3 }];
const selectedFieldKeys: string[][] = [];

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: (fields: Record<string, unknown>) => {
      selectedFieldKeys.push(Object.keys(fields));
      return {
      from: () => ({
        where: async () => periodTotals,
        leftJoin: () => ({
          where: async () => attachmentStats,
        }),
      }),
    };
    },
  }),
}));

describe("getStorePeriodSummary", () => {
  beforeEach(() => {
    selectedFieldKeys.length = 0;
  });

  it("returns SQL period totals with attachment counts", async () => {
    const { getStorePeriodSummary } = await import("./get-store-period-summary");
    const summary = await getStorePeriodSummary({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      from: "2026-06-01",
      to: "2026-06-30",
    });

    expect(summary.totalSales.amountHalalas).toBe(200000);
    expect(summary.totalOutflow.amountHalalas).toBe(25000);
    expect(summary.netMovement.amountHalalas).toBe(175000);
    expect(summary.attachmentCount).toBe(3);
    expect(summary).not.toHaveProperty("pendingReviewCount");
    expect(selectedFieldKeys).toContainEqual(["salesHalalas", "outflowHalalas"]);
    expect(selectedFieldKeys).not.toContainEqual(["type", "amountHalalas"]);
  });
});
