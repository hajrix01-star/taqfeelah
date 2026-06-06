import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

const dayRows = [
  {
    date: "2026-06-01",
    salesHalalas: 50000,
    outflowHalalas: 10000,
  },
  {
    date: "2026-06-02",
    salesHalalas: 0,
    outflowHalalas: 1500,
  },
];

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          groupBy: () => ({
            orderBy: async () => dayRows,
          }),
        }),
      }),
    }),
  }),
}));

describe("getStoreDaysReport", () => {
  it("returns per-day totals with domain outflow ratios", async () => {
    const { getStoreDaysReport } = await import("./get-store-days-report");
    const report = await getStoreDaysReport({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      from: "2026-06-01",
      to: "2026-06-30",
    });

    expect(report.days).toHaveLength(2);
    expect(report.days[0]).toMatchObject({
      date: "2026-06-01",
      outflowRatio: "20.0%",
      outflowRatioStatus: "calculable",
    });
    expect(report.days[1]).toMatchObject({
      date: "2026-06-02",
      outflowRatio: "—",
      outflowRatioStatus: "notCalculable",
    });
  });
});
