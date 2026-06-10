import { formatOutflowRatio, toHalalas, toRiyals } from "@/core/money/halalas";
import type { DaySummary, EntryKind, MovementRow } from "@/domain/cash-movement/types";

const OUTFLOW_ENTRY_TYPES = new Set<EntryKind>(["purchases", "expense", "withdrawal"]);

export type UiEntryLike = {
  type: string;
  amount: number;
  status?: string;
};

export type UiTotals = {
  sales: number;
  expense: number;
  net: number;
  ratio: string;
};

export function calculateDaySummary(rows: MovementRow[]): DaySummary {
  const totals = rows.reduce(
    (acc, row) => {
      if (row.type === "summary") {
        acc.sales += row.amountHalalas;
      } else {
        acc.outflow += row.amountHalalas;
      }
      return acc;
    },
    { sales: 0, outflow: 0 },
  );

  const netMovementHalalas = totals.sales - totals.outflow;
  const { ratio, status } = formatOutflowRatio(totals.sales, totals.outflow);

  return {
    totalSalesHalalas: totals.sales,
    totalOutflowHalalas: totals.outflow,
    netMovementHalalas,
    outflowRatio: ratio,
    outflowRatioStatus: status,
  };
}

export function combineDaySummaries(summaries: DaySummary[]): DaySummary {
  const combined = summaries.reduce(
    (acc, summary) => ({
      sales: acc.sales + summary.totalSalesHalalas,
      outflow: acc.outflow + summary.totalOutflowHalalas,
    }),
    { sales: 0, outflow: 0 },
  );

  const netMovementHalalas = combined.sales - combined.outflow;
  const { ratio, status } = formatOutflowRatio(combined.sales, combined.outflow);

  return {
    totalSalesHalalas: combined.sales,
    totalOutflowHalalas: combined.outflow,
    netMovementHalalas,
    outflowRatio: ratio,
    outflowRatioStatus: status,
  };
}

export function rowsFromUiEntries(entries: UiEntryLike[]): MovementRow[] {
  return entries
    .filter((entry) => entry.status !== "voided")
    .filter((entry) => entry.type === "summary" || OUTFLOW_ENTRY_TYPES.has(entry.type as EntryKind))
    .map((entry) => ({
      type: entry.type as EntryKind,
      amountHalalas: toHalalas(entry.amount),
    }));
}

export function daySummaryToUiTotals(
  summary: DaySummary,
  meta: { proofs?: number } = {},
): UiTotals & { proofs: number } {
  return {
    sales: toRiyals(summary.totalSalesHalalas),
    expense: toRiyals(summary.totalOutflowHalalas),
    net: toRiyals(summary.netMovementHalalas),
    ratio: summary.outflowRatio,
    proofs: meta.proofs ?? 0,
  };
}

export function combineUiTotalsFromSummaries(summaries: DaySummary[]): UiTotals {
  const combined = combineDaySummaries(summaries);
  const { proofs, ...totals } = daySummaryToUiTotals(combined);
  void proofs;
  return totals;
}
