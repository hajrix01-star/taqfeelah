import { toRiyals } from "@/core/money/halalas";
import { countCloseoutAttachments } from "@/features/closeouts/client/closeout-attachment-utils";
import { computeCloseoutTotals, salesArrayFromRecord } from "./closeout-calculations";

function readShareAmount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Accept UI totals, API ack payloads, and persisted closeout totals. */
export function normalizeCloseoutShareTotals(totals) {
  if (!totals || typeof totals !== "object") return null;
  const sales = readShareAmount(
    totals.sales
    ?? totals.totalSales
    ?? (totals.totalSalesHalalas != null ? toRiyals(totals.totalSalesHalalas) : 0),
  );
  const expense = readShareAmount(
    totals.expense
    ?? totals.totalOutflow
    ?? (totals.totalOutflowHalalas != null ? toRiyals(totals.totalOutflowHalalas) : 0),
  );
  const netFromFields = totals.net ?? totals.netMovement;
  const net = netFromFields != null && netFromFields !== ""
    ? readShareAmount(netFromFields)
    : totals.netMovementHalalas != null
      ? toRiyals(totals.netMovementHalalas)
      : sales - expense;
  const ratio = typeof totals.ratio === "string"
    ? totals.ratio
    : (typeof totals.outflowRatio === "string" ? totals.outflowRatio : null);
  if (sales <= 0 && expense <= 0 && net === 0 && !ratio) return null;
  return { sales, expense, net, ratio };
}

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
  const summaryAttachment = countCloseoutAttachments(closeout.attachments) > 0;

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
    const hasAtt = countCloseoutAttachments(item.attachments) > 0;
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
  const normalized = normalizeCloseoutShareTotals(closeout?.totals);
  if (normalized) {
    const { sales, expense, net } = normalized;
    const ratio = normalized.ratio
      || (sales > 0 ? `${((expense / sales) * 100).toFixed(1)}%` : expense > 0 ? "—" : "0.0%");
    return { sales, expense, net, ratio };
  }
  const computed = computeCloseoutTotals(closeout?.sales, closeout?.outflows);
  const sales = computed.totalSales || 0;
  const expense = computed.totalOutflow || 0;
  const ratio = sales > 0 ? `${((expense / sales) * 100).toFixed(1)}%` : expense > 0 ? "—" : "0.0%";
  return { sales, expense, net: computed.netMovement ?? sales - expense, ratio };
}
