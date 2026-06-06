import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

const entryRows = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    date: "2026-06-05",
    type: "summary",
    amountHalalas: 150000,
    note: "day sales",
    createdAt: new Date("2026-06-05T10:00:00.000Z"),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    date: "2026-06-05",
    type: "expense",
    amountHalalas: 25000,
    note: "supplies",
    createdAt: new Date("2026-06-05T11:00:00.000Z"),
  },
];

const channelRows = [
  {
    entryId: "11111111-1111-4111-8111-111111111111",
    salesChannelId: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
    channelNameSnapshot: "Cash",
    amountHalalas: 150000,
  },
];

vi.mock("@/features/reports/server/get-store-period-summary", () => ({
  getStorePeriodSummary: vi.fn(async () => ({
    totalSales: { amountHalalas: 150000, currency: "SAR" },
    totalOutflow: { amountHalalas: 25000, currency: "SAR" },
    netMovement: { amountHalalas: 125000, currency: "SAR" },
    outflowRatio: "16.7%",
    attachmentCount: 1,
    pendingReviewCount: 0,
  })),
}));

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: (fields: Record<string, unknown>) => ({
      from: () => ({
        where: () => {
          if ("entryId" in fields) {
            return Promise.resolve(channelRows);
          }
          if ("id" in fields && Object.keys(fields).length === 1) {
            return Promise.resolve([{ entryId: "11111111-1111-4111-8111-111111111111" }]);
          }
          return {
            orderBy: () => ({
              limit: async () => entryRows,
            }),
          };
        },
      }),
    }),
  }),
}));

describe("getNotebookExport", () => {
  it("returns SQL-backed notebook export payload", async () => {
    const { getNotebookExport } = await import("./get-notebook-export");
    const result = await getNotebookExport({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      from: "2026-06-05",
      to: "2026-06-05",
      period: "day",
    });

    expect(result.totals.sales).toBe(1500);
    expect(result.totals.expense).toBe(250);
    expect(result.totals.net).toBe(1250);
    expect(result.channels).toEqual([{
      channelId: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
      name: "Cash",
      amount: 1500,
    }]);
    expect(result.operations).toHaveLength(2);
    expect(result.operations[0].hasAttachment).toBe(true);
  });
});
