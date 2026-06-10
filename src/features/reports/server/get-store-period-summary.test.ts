import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

const movementRows = [
  { type: "summary", amountHalalas: 200000 },
  { type: "purchases", amountHalalas: 15000 },
  { type: "expense", amountHalalas: 10000 },
];
const attachmentStats = [{ attachmentCount: 3 }];

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: async () => movementRows,
        leftJoin: () => ({
          where: async () => attachmentStats,
        }),
      }),
    }),
  }),
}));

describe("getStorePeriodSummary", () => {
  it("returns SQL period totals with attachment counts and zero legacy pending field", async () => {
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
    expect(summary.pendingReviewCount).toBe(0);
  });
});
