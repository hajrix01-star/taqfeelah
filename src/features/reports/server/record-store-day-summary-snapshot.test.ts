import { describe, expect, it, vi } from "vitest";
import { auditEvents } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

const getStoreDaySummary = vi.fn(async () => ({
  storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  date: "2026-06-05",
  totalSales: { amountHalalas: 120000, currency: "SAR" as const },
  totalOutflow: { amountHalalas: 25000, currency: "SAR" as const },
  netMovement: { amountHalalas: 95000, currency: "SAR" as const },
  outflowRatio: "20.8%",
  outflowRatioStatus: "calculable" as const,
  attachmentCount: 0,
  pendingReviewCount: 0,
}));

vi.mock("@/features/reports/server/get-store-day-summary", () => ({
  getStoreDaySummary,
}));

const insertCalls: Array<{ table: unknown; values: unknown }> = [];

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    insert: (table: unknown) => ({
      values: (values: unknown) => ({
        returning: async () => {
          insertCalls.push({ table, values });
          return [{ id: "audit-1", createdAt: new Date("2026-06-05T10:00:00Z") }];
        },
      }),
    }),
  }),
}));

const baseInput = {
  organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
  storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  date: "2026-06-05",
  actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
  actorRole: "owner" as const,
};

describe("recordStoreDaySummarySnapshot", () => {
  it("records snapshot when posted totals match server-computed totals", async () => {
    insertCalls.length = 0;
    const { recordStoreDaySummarySnapshot } = await import("./record-store-day-summary-snapshot");

    const created = await recordStoreDaySummarySnapshot({
      ...baseInput,
      totalSalesHalalas: 120000,
      totalOutflowHalalas: 25000,
      note: "owner confirmed",
    });

    expect(created.id).toBe("audit-1");
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]?.table).toBe(auditEvents);
    expect((insertCalls[0]?.values as { metadata: { verifiedAgainstServer: boolean } }).metadata).toMatchObject({
      verifiedAgainstServer: true,
      totalSalesHalalas: 120000,
      totalOutflowHalalas: 25000,
    });
  });

  it("rejects snapshot when posted totals do not match server-computed totals", async () => {
    insertCalls.length = 0;
    const { recordStoreDaySummarySnapshot } = await import("./record-store-day-summary-snapshot");

    await expect(recordStoreDaySummarySnapshot({
      ...baseInput,
      totalSalesHalalas: 99999,
      totalOutflowHalalas: 25000,
    })).rejects.toBeInstanceOf(ValidationError);

    expect(insertCalls).toHaveLength(0);
  });
});
