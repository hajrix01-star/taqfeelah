/** @typedef {{ channelId: string, name: string, amount: number }} SalesChannelRow */

/**
 * @param {Record<string, number> | SalesChannelRow[]} sales
 * @param {{ id: string, amount: number }[]} outflows
 */
export function computeCloseoutTotals(sales, outflows = []) {
  let totalSales = 0;
  if (Array.isArray(sales)) {
    totalSales = sales.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  } else if (sales && typeof sales === "object") {
    totalSales = Object.values(sales).reduce((sum, value) => {
      const amount = typeof value === "number" ? value : Number(value?.amount || 0);
      return sum + amount;
    }, 0);
  }
  const totalOutflow = (outflows || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return {
    totalSales,
    totalOutflow,
    netMovement: totalSales - totalOutflow,
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
