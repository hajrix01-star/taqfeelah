import type { DaySummary, MovementRow } from "@/domain/cash-movement/types";

function formatRatio(value: number): string {
  return `${value.toFixed(1)}%`;
}

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

  if (totals.sales === 0 && totals.outflow > 0) {
    return {
      totalSalesHalalas: totals.sales,
      totalOutflowHalalas: totals.outflow,
      netMovementHalalas,
      outflowRatio: "—",
      outflowRatioStatus: "notCalculable",
    };
  }

  const ratio = totals.sales === 0 ? 0 : (totals.outflow / totals.sales) * 100;

  return {
    totalSalesHalalas: totals.sales,
    totalOutflowHalalas: totals.outflow,
    netMovementHalalas,
    outflowRatio: formatRatio(ratio),
    outflowRatioStatus: "calculable",
  };
}
