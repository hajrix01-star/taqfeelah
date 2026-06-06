import { toHalalas, toRiyals } from "@/core/money/halalas";
import { calculateDaySummary } from "@/domain/cash-movement/calculations";
import type { MovementRow } from "@/domain/cash-movement/types";

export type CloseoutTotals = {
  totalSales: number;
  totalOutflow: number;
  netMovement: number;
  outflowRatio: string;
  outflowRatioStatus: "calculable" | "notCalculable";
};

export function closeoutTotalsFromHalalas(
  totalSalesHalalas: number,
  totalOutflowHalalas: number,
): CloseoutTotals {
  const rows: MovementRow[] = [];
  if (totalSalesHalalas > 0) {
    rows.push({ type: "summary", amountHalalas: totalSalesHalalas });
  }
  if (totalOutflowHalalas > 0) {
    rows.push({ type: "expense", amountHalalas: totalOutflowHalalas });
  }

  const summary = calculateDaySummary(rows);
  return {
    totalSales: toRiyals(summary.totalSalesHalalas),
    totalOutflow: toRiyals(summary.totalOutflowHalalas),
    netMovement: toRiyals(summary.netMovementHalalas),
    outflowRatio: summary.outflowRatio,
    outflowRatioStatus: summary.outflowRatioStatus,
  };
}

export function closeoutTotalsFromRiyalRows(
  salesRows: Array<{ amount: number }>,
  outflowRows: Array<{ amount: number }>,
): CloseoutTotals {
  const totalSalesHalalas = salesRows.reduce((sum, row) => sum + toHalalas(row.amount), 0);
  const totalOutflowHalalas = outflowRows.reduce((sum, row) => sum + toHalalas(row.amount), 0);
  return closeoutTotalsFromHalalas(totalSalesHalalas, totalOutflowHalalas);
}
