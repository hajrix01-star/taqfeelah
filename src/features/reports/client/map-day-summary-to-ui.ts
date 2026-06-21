import { toHalalas } from "@/core/money/halalas";
import {
  calculateDaySummary,
  combineDaySummaries,
  daySummaryToUiTotals,
} from "@/domain/cash-movement/calculations";
import type { MovementRow } from "@/domain/cash-movement/types";
import type { ApiPeriodSummary, UiTotalsRecord } from "@/features/reports/client/reports-client-types";

function daySummaryFromUiTotalsRecord(record: UiTotalsRecord) {
  const salesHalalas = toHalalas(Number(record?.sales || 0));
  const outflowHalalas = toHalalas(Number(record?.expense || 0));
  const rows: MovementRow[] = [];
  if (salesHalalas > 0) {
    rows.push({ type: "summary", amountHalalas: salesHalalas });
  }
  if (outflowHalalas > 0) {
    rows.push({ type: "expense", amountHalalas: outflowHalalas });
  }
  return calculateDaySummary(rows);
}

export function mapDaySummaryToUiTotals(apiSummary: ApiPeriodSummary | null | undefined): UiTotalsRecord {
  const salesHalalas = Number(apiSummary?.totalSales?.amountHalalas || 0);
  const outflowHalalas = Number(apiSummary?.totalOutflow?.amountHalalas || 0);
  const netHalalas = Number(apiSummary?.netMovement?.amountHalalas ?? (salesHalalas - outflowHalalas));
  const ratio = apiSummary?.outflowRatioStatus === "notCalculable"
    ? "—"
    : (typeof apiSummary?.outflowRatio === "string" ? apiSummary.outflowRatio : "0.0%");

  return {
    sales: salesHalalas / 100,
    expense: outflowHalalas / 100,
    net: netHalalas / 100,
    ratio,
    proofs: Number(apiSummary?.attachmentCount || 0),
  };
}

export function combineUiTotals(records: UiTotalsRecord[]): UiTotalsRecord {
  const list = Array.isArray(records) ? records : [];
  const combined = combineDaySummaries(list.map(daySummaryFromUiTotalsRecord));
  const proofs = list.reduce((sum, record) => sum + Number(record?.proofs || 0), 0);
  const totals = daySummaryToUiTotals(combined, { proofs });
  return {
    sales: totals.sales,
    expense: totals.expense,
    net: totals.net,
    ratio: totals.ratio,
    proofs: totals.proofs,
  };
}
