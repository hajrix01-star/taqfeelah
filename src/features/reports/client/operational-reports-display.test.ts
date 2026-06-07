import { describe, expect, it } from "vitest";
import {
  buildLocalReportDaysFromEntries,
  buildOutflowByCategoryFromEntries,
  computeOutflowAnalysisMetrics,
  filterOutflowEntriesForPeriod,
  percentageOfSalesAmount,
} from "./operational-reports-display";

describe("operational-reports-display", () => {
  it("builds local report day rows for a month", () => {
    const rows = buildLocalReportDaysFromEntries([
      { id: "1", type: "summary", status: "active", date: "2026-06-06", amount: 100, businessId: "b1" },
      { id: "2", type: "expense", status: "active", date: "2026-06-06", amount: 20, businessId: "b1", categoryId: "other" },
    ], "2026-06");
    expect(rows).toHaveLength(1);
    expect(rows[0].sales).toBe(100);
    expect(rows[0].expense).toBe(20);
  });

  it("filters outflow entries for a selected business and category", () => {
    const rows = filterOutflowEntriesForPeriod({
      entries: [
        { id: "1", type: "expense", status: "active", date: "2026-06-06", amount: 10, businessId: "b1", categoryId: "other" },
        { id: "2", type: "expense", status: "active", date: "2026-06-06", amount: 5, businessId: "b2", categoryId: "other" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test fixture
      ] as any[],
      selectedBusiness: "b1",
      category: "other",
      period: "day",
      selectedDate: "2026-06-06",
      selectedMonth: "2026-06",
      selectedYear: "2026",
      customFrom: "2026-01-01",
      customTo: "2026-12-31",
    });
    expect(rows).toHaveLength(1);
    expect((rows[0] as { id: string }).id).toBe("1");
  });

  it("computes outflow analysis metrics", () => {
    const metrics = computeOutflowAnalysisMetrics([
      { amount: 10 },
      { amount: 20 },
    ]);
    expect(metrics.total).toBe(30);
    expect(metrics.count).toBe(2);
    expect(metrics.average).toBe(15);
  });

  it("builds outflow categories from period entries", () => {
    const categories = buildOutflowByCategoryFromEntries(
      [{ id: "1", type: "expense", status: "active", amount: 12, categoryId: "other" }],
      [{ id: "all", label: "all" }, { id: "other", label: "other" }],
    );
    expect(categories).toEqual([{ id: "other", label: "other", amount: 12 }]);
  });

  it("formats percentage of sales", () => {
    expect(percentageOfSalesAmount(25, 100)).toBe("25.0%");
    expect(percentageOfSalesAmount(10, 0)).toBe("—");
  });
});
