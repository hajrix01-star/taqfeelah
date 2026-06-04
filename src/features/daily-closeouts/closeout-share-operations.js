import { computeCloseoutTotals, salesArrayFromRecord } from "./closeout-calculations";

function outflowRowLabel(item, lang) {
  const typeMap = {
    purchases: lang === "ar" ? "مشتريات" : "Purchases",
    expense: lang === "ar" ? "مصروف" : "Expense",
    withdrawal: lang === "ar" ? "سحب" : "Withdrawal",
  };
  const type = typeMap[item.type] || item.type;
  const category = item.category || item.typeLabel || item.note;
  return category ? `${type} · ${category}` : type;
}

function formatOpTime(iso, lang) {
  if (!iso) return "";
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Rows for notebook share preview — one line per sales channel (matches owner register details). */
export function buildCloseoutShareOperationRows(closeout, lang) {
  if (!closeout) return [];
  const rows = [];
  const salesRows = salesArrayFromRecord(closeout.sales);
  const stamp = closeout.submittedAt || closeout.createdAt || closeout.openedAt;
  const metaSuffix = (hasAttachment) => {
    const time = formatOpTime(stamp, lang);
    const att = hasAttachment
      ? (lang === "ar" ? "يوجد مرفق" : "Has attachment")
      : (lang === "ar" ? "بدون مرفق" : "No attachment");
    return time ? `${time} · ${att}` : att;
  };
  const summaryAttachment = Boolean((closeout.attachments || []).length);

  salesRows
    .filter((row) => Number(row.amount) > 0)
    .forEach((row, index) => {
      rows.push({
        id: `${closeout.id}-sale-${row.channelId || index}`,
        label: row.name || row.channelId || (lang === "ar" ? "قناة" : "Channel"),
        amount: Number(row.amount),
        isSale: true,
        meta: metaSuffix(summaryAttachment && index === 0),
      });
    });

  (closeout.outflows || []).forEach((item, index) => {
    const hasAtt = Boolean((item.attachments || []).length);
    rows.push({
      id: `${closeout.id}-out-${item.id || index}`,
      label: outflowRowLabel(item, lang),
      amount: Number(item.amount),
      isSale: false,
      meta: metaSuffix(hasAtt),
    });
  });

  return rows;
}

export function closeoutShareTotals(closeout) {
  const totals = closeout.totals || computeCloseoutTotals(closeout.sales, closeout.outflows);
  const sales = totals.totalSales || 0;
  const expense = totals.totalOutflow || 0;
  const ratio = sales > 0 ? `${((expense / sales) * 100).toFixed(1)}%` : expense > 0 ? "—" : "0.0%";
  return { sales, expense, net: totals.netMovement ?? sales - expense, ratio };
}
