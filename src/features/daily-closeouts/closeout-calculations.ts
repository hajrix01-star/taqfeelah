import { toHalalas, toRiyals } from "@/core/money/halalas";
import { calculateDaySummary } from "@/domain/cash-movement/calculations";
import type { EntryKind, MovementRow } from "@/domain/cash-movement/types";
import { normalizeCloseoutSalesToArray } from "./closeout-sales-normalize";
import type {
  CloseoutOutflow,
  CloseoutSalesChannelRow,
  CloseoutSalesRecord,
  CloseoutTotals,
  SalesChannelConfig,
} from "./daily-closeouts-types";

const OUTFLOW_TYPES = new Set(["purchases", "expense", "withdrawal"]);

function collectSalesRows(sales: CloseoutSalesRecord | null | undefined): number[] {
  return normalizeCloseoutSalesToArray(sales).map((row) => Number(row.amount || 0));
}

export function computeCloseoutTotals(
  sales: CloseoutSalesRecord | null | undefined,
  outflows: CloseoutOutflow[] = [],
): CloseoutTotals {
  const rows: MovementRow[] = [
    ...collectSalesRows(sales)
      .filter((amount) => amount > 0)
      .map((amount) => ({ type: "summary" as EntryKind, amountHalalas: toHalalas(amount) })),
    ...(outflows || [])
      .filter((row) => Number(row.amount || 0) > 0)
      .map((row) => ({
        type: (OUTFLOW_TYPES.has(String(row?.type)) ? String(row.type) : "expense") as EntryKind,
        amountHalalas: toHalalas(Number(row.amount || 0)),
      })),
  ];
  const summary = calculateDaySummary(rows);
  return {
    totalSales: toRiyals(summary.totalSalesHalalas),
    totalOutflow: toRiyals(summary.totalOutflowHalalas),
    netMovement: toRiyals(summary.netMovementHalalas),
  };
}

export function salesRecordFromChannels(
  salesChannels: SalesChannelConfig[],
  valuesById: Record<string, string | number>,
): Record<string, CloseoutSalesChannelRow> {
  const record: Record<string, CloseoutSalesChannelRow> = {};
  salesChannels.forEach((channel) => {
    const amount = Number(valuesById[channel.id] || 0);
    if (amount > 0) {
      record[channel.id] = {
        channelId: channel.id,
        name: channel.displayName || channel.nameAr || channel.nameEn || channel.name || channel.id,
        amount,
      };
    }
  });
  return record;
}

export function salesArrayFromRecord(
  salesRecord: CloseoutSalesRecord | null | undefined,
): CloseoutSalesChannelRow[] {
  return normalizeCloseoutSalesToArray(salesRecord);
}

/** Display totals always reconcile stored totals with sales/outflow rows. */
export function resolveCloseoutDisplayTotals(
  sales: CloseoutSalesRecord | null | undefined,
  outflows: CloseoutOutflow[] = [],
  storedTotals?: CloseoutTotals | null,
): CloseoutTotals {
  const fromRows = computeCloseoutTotals(sales, outflows);
  if (!storedTotals) return fromRows;
  const salesMatch = toHalalas(storedTotals.totalSales ?? 0) === toHalalas(fromRows.totalSales ?? 0);
  const outflowMatch = toHalalas(storedTotals.totalOutflow ?? 0) === toHalalas(fromRows.totalOutflow ?? 0);
  return salesMatch && outflowMatch ? storedTotals : fromRows;
}

export function resolveCloseoutRecordDisplayTotals(
  closeout: {
    sales?: CloseoutSalesRecord | null;
    outflows?: CloseoutOutflow[] | null;
    totals?: CloseoutTotals | null;
  } | null | undefined,
): CloseoutTotals {
  if (!closeout) {
    return { totalSales: 0, totalOutflow: 0, netMovement: 0 };
  }
  return resolveCloseoutDisplayTotals(
    closeout.sales,
    closeout.outflows || [],
    closeout.totals,
  );
}
