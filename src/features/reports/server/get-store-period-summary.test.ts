import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

let movementTotals = [
  { totalSalesHalalas: 200000, totalOutflowHalalas: 25000 },
];
let attachmentStats = [{ attachmentCount: 3 }];

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: async () => movementTotals,
        leftJoin: () => ({
          where: async () => attachmentStats,
        }),
      }),
    }),
  }),
}));

describe("getStorePeriodSummary", () => {
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
    expect(summary.outflowRatio).toBe("12.5%");
    expect(summary.outflowRatioStatus).toBe("calculable");
    expect(summary.attachmentCount).toBe(3);
    expect(summary).not.toHaveProperty("pendingReviewCount");
  });

  it("returns zero totals for empty periods", async () => {
    movementTotals = [{ totalSalesHalalas: 0, totalOutflowHalalas: 0 }];
    attachmentStats = [{ attachmentCount: 0 }];

    const { getStorePeriodSummary } = await import("./get-store-period-summary");
    const summary = await getStorePeriodSummary({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      from: "2026-06-01",
      to: "2026-06-30",
    });

    expect(summary.totalSales.amountHalalas).toBe(0);
    expect(summary.totalOutflow.amountHalalas).toBe(0);
    expect(summary.netMovement.amountHalalas).toBe(0);
    expect(summary.outflowRatio).toBe("0.0%");
    expect(summary.outflowRatioStatus).toBe("calculable");
    expect(summary.attachmentCount).toBe(0);
  });

  it("keeps ratio as not calculable when sales are zero but outflow exists", async () => {
    movementTotals = [{ totalSalesHalalas: 0, totalOutflowHalalas: 9000 }];
    attachmentStats = [{ attachmentCount: 1 }];

    const { getStorePeriodSummary } = await import("./get-store-period-summary");
    const summary = await getStorePeriodSummary({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      from: "2026-06-01",
      to: "2026-06-30",
    });

    expect(summary.totalSales.amountHalalas).toBe(0);
    expect(summary.totalOutflow.amountHalalas).toBe(9000);
    expect(summary.netMovement.amountHalalas).toBe(-9000);
    expect(summary.outflowRatio).toBe("—");
    expect(summary.outflowRatioStatus).toBe("notCalculable");
  });

  it("matches legacy semantics by excluding voided entries from totals", async () => {
    movementTotals = [{ totalSalesHalalas: 120000, totalOutflowHalalas: 20000 }];
    attachmentStats = [{ attachmentCount: 2 }];

    const { getStorePeriodSummary } = await import("./get-store-period-summary");
    const summary = await getStorePeriodSummary({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      from: "2026-06-01",
      to: "2026-06-30",
    });

    expect(summary.totalSales.amountHalalas).toBe(120000);
    expect(summary.totalOutflow.amountHalalas).toBe(20000);
    expect(summary.netMovement.amountHalalas).toBe(100000);
  });

  it("rejects overly large date ranges", async () => {
    const { getStorePeriodSummary } = await import("./get-store-period-summary");
    await expect(getStorePeriodSummary({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      from: "2025-01-01",
      to: "2026-06-30",
    })).rejects.toBeInstanceOf(ValidationError);
  });
});
