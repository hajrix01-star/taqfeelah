import { formatOutflowRatio, toHalalas, toRiyals } from "@/core/money/halalas";
import type { DaySummary, EntryKind, MovementRow } from "@/domain/cash-movement/types";

const OUTFLOW_ENTRY_TYPES = new Set<EntryKind>(["purchases", "expense", "withdrawal"]);

export type UiEntryLike = {
  type: string;
  amount: number;
  status?: string;
  salesChannels?: Array<{ amount?: number | null }>;
};

/** Reconcile stored summary amount vs channel rows (owner edit may hydrate one before the other). */
export function reconcileSummarySalesDisplayRiyals(
  storedAmountRiyals: number,
  channelAmountsRiyals: number[] = [],
): number {
  const storedHalalas = toHalalas(Number(storedAmountRiyals) || 0);
  if (!Array.isArray(channelAmountsRiyals) || channelAmountsRiyals.length === 0) {
    return toRiyals(storedHalalas);
  }
  const channelSumHalalas = toHalalas(sumUiAmounts(
    channelAmountsRiyals.map((amount) => Number(amount) || 0),
  ));
  if (storedHalalas === channelSumHalalas) {
    return toRiyals(storedHalalas);
  }
  return toRiyals(Math.max(storedHalalas, channelSumHalalas));
}

export function resolveSummaryEntrySalesAmountRiyals(entry: UiEntryLike): number {
  if (entry.type !== "summary") return Number(entry.amount ?? 0);
  const channels = Array.isArray(entry.salesChannels) ? entry.salesChannels : [];
  return reconcileSummarySalesDisplayRiyals(
    Number(entry.amount ?? 0),
    channels.map((row) => Number(row.amount ?? 0)),
  );
}

export function rowsFromUiEntries(entries: UiEntryLike[]): MovementRow[] {
  return entries
    .filter((entry) => entry.status !== "voided")
    .filter((entry) => entry.type === "summary" || OUTFLOW_ENTRY_TYPES.has(entry.type as EntryKind))
    .map((entry) => ({
      type: entry.type as EntryKind,
      amountHalalas: toHalalas(resolveSummaryEntrySalesAmountRiyals(entry)),
    }));
}

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

export function addUiAmounts(leftRiyals: number, rightRiyals: number): number {
  return toRiyals(toHalalas(leftRiyals) + toHalalas(rightRiyals));
}

export function sumUiAmounts(amounts: number[]): number {
  return toRiyals(
    amounts.reduce((sum, amount) => sum + toHalalas(amount), 0),
  );
}
