import { toHalalas, toRiyals } from "@/core/money/halalas";
import { calculateDaySummary } from "@/domain/cash-movement/calculations";

/** @typedef {{ channelId: string, name: string, amount: number }} SalesChannelRow */

const OUTFLOW_TYPES = new Set(["purchases", "expense", "withdrawal"]);

function collectSalesRows(sales) {
  if (Array.isArray(sales)) {
    return sales.map((row) => Number(row.amount || 0));
  }
  if (sales && typeof sales === "object") {
    return Object.values(sales).map((value) => (
      typeof value === "number" ? value : Number(value?.amount || 0)
    ));
  }
  return [];
}

/**
 * @param {Record<string, number> | SalesChannelRow[]} sales
 * @param {{ id: string, amount: number, type?: string }[]} outflows
 */
export function computeCloseoutTotals(sales, outflows = []) {
  const rows = [
    ...collectSalesRows(sales)
      .filter((amount) => amount > 0)
      .map((amount) => ({ type: "summary", amountHalalas: toHalalas(amount) })),
    ...(outflows || [])
      .filter((row) => Number(row.amount || 0) > 0)
      .map((row) => ({
        type: OUTFLOW_TYPES.has(row?.type) ? row.type : "expense",
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

export function salesRecordFromChannels(salesChannels, valuesById) {
  const record = {};
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

export function salesArrayFromRecord(salesRecord) {
  if (!salesRecord) return [];
  if (Array.isArray(salesRecord)) return salesRecord;
  return Object.values(salesRecord).map((row) => ({
    channelId: row.channelId || row.id,
    name: row.name,
    amount: Number(row.amount || 0),
  }));
}
