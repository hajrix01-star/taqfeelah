import { toHalalas, toRiyals } from "@/core/money/halalas";
import { calculateDaySummary } from "@/domain/cash-movement/calculations";
import type { EntryKind, MovementRow } from "@/domain/cash-movement/types";
import type {
  CloseoutOutflow,
  CloseoutSalesChannelRow,
  CloseoutSalesRecord,
  CloseoutTotals,
  SalesChannelConfig,
} from "./daily-closeouts-types";

const OUTFLOW_TYPES = new Set(["purchases", "expense", "withdrawal"]);

function collectSalesRows(sales: CloseoutSalesRecord | null | undefined): number[] {
  if (Array.isArray(sales)) {
    return sales.map((row) => Number(row.amount || 0));
  }
  if (sales && typeof sales === "object") {
    return Object.values(sales).map((value) => (
      typeof value === "number" ? value : Number((value as CloseoutSalesChannelRow)?.amount || 0)
    ));
  }
  return [];
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
  if (!salesRecord) return [];
  if (Array.isArray(salesRecord)) return salesRecord;
  return Object.values(salesRecord).map((row) => {
    const channelRow = typeof row === "object" ? row : { amount: row };
    return {
      channelId: channelRow.channelId || channelRow.id,
      name: channelRow.name,
      amount: Number(channelRow.amount || 0),
    };
  });
}
