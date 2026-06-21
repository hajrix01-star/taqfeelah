import { describe, expect, it } from "vitest";
import { formatOutflowRatio } from "@/core/money/halalas";
import {
  calculateDaySummary,
  combineDaySummaries,
  combineUiTotalsFromSummaries,
  daySummaryToUiTotals,
  rowsFromUiEntries,
} from "@/domain/cash-movement/calculations";
import { GOLDEN_ACCOUNTING_CASES } from "@/domain/cash-movement/golden-fixtures";
import { computeCloseoutTotals } from "@/features/daily-closeouts/closeout-calculations";
import { combineUiTotals } from "@/features/reports/client/map-day-summary-to-ui";
import { summarizeEntries } from "@/features/operations/operational-analytics";

function expectTotals(
  actual: { sales: number; expense: number; net: number; ratio: string },
  expected: GoldenAccountingCase["expected"],
  label: string,
) {
  expect(actual.sales, `${label}.sales`).toBe(expected.salesRiyals);
  expect(actual.expense, `${label}.expense`).toBe(expected.expenseRiyals);
  expect(actual.net, `${label}.net`).toBe(expected.netRiyals);
  expect(actual.ratio, `${label}.ratio`).toBe(expected.ratio);
}

type GoldenAccountingCase = (typeof GOLDEN_ACCOUNTING_CASES)[number];

describe("golden accounting parity", () => {
  it.each(GOLDEN_ACCOUNTING_CASES)("$id keeps domain, client, and closeout math aligned", (fixture) => {
    const domainSummary = calculateDaySummary(fixture.rows);
    const domainUi = daySummaryToUiTotals(domainSummary);
    const rowsFromUi = calculateDaySummary(rowsFromUiEntries(fixture.uiEntries));
    const rowsFromUiTotals = daySummaryToUiTotals(rowsFromUi);
    const clientTotals = summarizeEntries(fixture.uiEntries);
    const closeoutTotals = computeCloseoutTotals(fixture.closeoutSales, fixture.closeoutOutflows);
    const closeoutRatio = formatOutflowRatio(
      Math.round((closeoutTotals.totalSales || 0) * 100),
      Math.round((closeoutTotals.totalOutflow || 0) * 100),
    ).ratio;

    expectTotals(domainUi, fixture.expected, "domain");
    expectTotals(rowsFromUiTotals, fixture.expected, "rowsFromUiEntries");
    expectTotals(clientTotals, fixture.expected, "summarizeEntries");
    expect(closeoutTotals.totalSales).toBe(fixture.expected.salesRiyals);
    expect(closeoutTotals.totalOutflow).toBe(fixture.expected.expenseRiyals);
    expect(closeoutTotals.netMovement).toBe(fixture.expected.netRiyals);
    expect(closeoutRatio).toBe(fixture.expected.ratio);

    if (fixture.combineParts?.length) {
      const partSummaries = fixture.combineParts.map((part) => calculateDaySummary([
        { type: "summary", amountHalalas: Math.round(part.sales * 100) },
        { type: "expense", amountHalalas: Math.round(part.expense * 100) },
      ]));
      const combinedDomain = combineUiTotalsFromSummaries(partSummaries);
      const combinedClient = combineUiTotals(fixture.combineParts.map((part) => ({
        ...part,
        proofs: 0,
      })));
      const mergedSummary = combineDaySummaries(partSummaries);
      const mergedUi = daySummaryToUiTotals(mergedSummary);

      expectTotals(combinedDomain, fixture.expected, "combineDomain");
      expectTotals(combinedClient, fixture.expected, "combineClient");
      expectTotals(mergedUi, fixture.expected, "combineDaySummaries");
    }
  });
});
