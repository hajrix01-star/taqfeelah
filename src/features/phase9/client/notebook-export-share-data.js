import { resolveReportDateRange } from "@/features/reports/client/report-period-range";

const OUTFLOW_TYPES = new Set(["purchases", "expense", "withdrawal"]);

export function canFetchNotebookExportForSnapshot(snapshot, enabled) {
  if (!enabled || !snapshot || typeof snapshot !== "object") return false;
  if (snapshot.selectedBusiness === "all") return false;
  if (!snapshot.selectedBusiness) return false;
  return true;
}

export function buildNotebookExportRequest(snapshot) {
  const period = snapshot.period || "day";
  const range = resolveReportDateRange({
    period,
    selectedDate: snapshot.selectedDate || "",
    selectedMonth: snapshot.selectedMonth || "",
    selectedYear: snapshot.selectedYear || "",
    customFrom: snapshot.customFrom || "",
    customTo: snapshot.customTo || "",
  });

  const request = {
    storeId: snapshot.selectedBusiness,
    period,
    from: range.from,
    to: range.to,
  };

  if (period === "day" && snapshot.selectedDate) {
    request.date = snapshot.selectedDate;
  }
  if (period === "month" && snapshot.selectedMonth) {
    request.month = snapshot.selectedMonth;
  }

  return request;
}

export function mapNotebookExportOperationToEntry(operation, businessId) {
  const amount = Number(operation?.amount) || 0;
  return {
    id: operation?.id || `op-${operation?.date || "unknown"}`,
    businessId,
    date: operation?.date || "",
    type: operation?.type || "summary",
    amount,
    note: operation?.note || "",
    createdAt: operation?.createdAt || "",
    reviewed: true,
    status: "active",
    salesChannels: [],
    attachment: operation?.hasAttachment ? { kind: "image", name: "attachment" } : null,
  };
}

export function mapNotebookExportToShareData(payload, snapshot) {
  if (!payload || typeof payload !== "object") return null;

  const businessId = snapshot?.selectedBusiness || payload.storeId || "";
  const totals = payload.totals || {};
  const record = {
    sales: Number(totals.sales) || 0,
    expense: Number(totals.expense) || 0,
    net: Number(totals.net) || 0,
    ratio: typeof totals.ratio === "string" ? totals.ratio : "0.0%",
    proofs: Number(totals.proofs) || 0,
    pending: Number(totals.pending) || 0,
  };

  const entries = (Array.isArray(payload.operations) ? payload.operations : [])
    .map((operation) => mapNotebookExportOperationToEntry(operation, businessId));

  const shareChannelRows = (Array.isArray(payload.channels) ? payload.channels : [])
    .filter((row) => Number(row?.amount) > 0)
    .map((row) => ({
      id: row.channelId || row.id,
      label: row.name || row.channelId || "",
      amount: Number(row.amount) || 0,
    }));

  const dayTotals = new Map();
  entries.forEach((entry) => {
    if (!entry.date) return;
    const current = dayTotals.get(entry.date) || { sales: 0, expense: 0 };
    if (entry.type === "summary") current.sales += entry.amount;
    if (OUTFLOW_TYPES.has(entry.type)) current.expense += entry.amount;
    dayTotals.set(entry.date, current);
  });

  const shareDayRows = [...dayTotals.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, values]) => ({
      date,
      sales: values.sales,
      expense: values.expense,
      net: values.sales - values.expense,
    }));

  return {
    entries,
    record,
    shareChannelRows,
    shareDayRows,
    proofs: record.proofs,
    pendingProofs: record.pending,
  };
}
