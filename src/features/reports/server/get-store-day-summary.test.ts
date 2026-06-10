import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

const movementRows = [{ type: "summary", amountHalalas: 120000 }, { type: "expense", amountHalalas: 25000 }];
const attachmentStats = [{ attachmentCount: 2 }];

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

describe("getStoreDaySummary", () => {
  it("returns SQL totals with attachment counts and zero legacy pending field", async () => {
    const { getStoreDaySummary } = await import("./get-store-day-summary");
    const summary = await getStoreDaySummary({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      date: "2026-06-05",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
    });

    expect(summary.totalSales.amountHalalas).toBe(120000);
    expect(summary.totalOutflow.amountHalalas).toBe(25000);
    expect(summary.netMovement.amountHalalas).toBe(95000);
    expect(summary.attachmentCount).toBe(2);
    expect(summary.pendingReviewCount).toBe(0);
  });
});
