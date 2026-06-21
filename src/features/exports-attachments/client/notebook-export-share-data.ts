import { resolveReportDateRange } from "@/features/reports/client/report-period-range";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import type { ExportSnapshot } from "@/features/exports/client/exports-client-types";
import type {
  NotebookExportRequest,
  NotebookExportShareData,
} from "@/features/exports-attachments/client/exports-attachments-client-types";

const OUTFLOW_TYPES = new Set(["purchases", "expense", "withdrawal"]);

export function canFetchNotebookExportForSnapshot(snapshot: ExportSnapshot | null | undefined, enabled: boolean) {
  if (!enabled || !snapshot || typeof snapshot !== "object") return false;
  if (snapshot.selectedBusiness === "all") return false;
  if (!snapshot.selectedBusiness) return false;
  return true;
}

export function buildNotebookExportRequest(snapshot: ExportSnapshot): NotebookExportRequest {
  const period = snapshot.period || "day";
  const range = resolveReportDateRange({
    period,
    selectedDate: snapshot.selectedDate || "",
    selectedMonth: snapshot.selectedMonth || "",
    selectedYear: snapshot.selectedYear || "",
    customFrom: snapshot.customFrom || "",
    customTo: snapshot.customTo || "",
  });

  const request: NotebookExportRequest = {
    storeId: String(snapshot.selectedBusiness || ""),
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

export function mapNotebookExportOperationToEntry(
  operation: Record<string, unknown>,
  businessId: string,
): OperationalEntry {
  const amount = Number(operation?.amount) || 0;
  return {
    id: String(operation?.id || `op-${operation?.date || "unknown"}`),
    businessId,
    date: String(operation?.date || ""),
    type: String(operation?.type || "summary"),
    amount,
    note: String(operation?.note || ""),
    createdAt: String(operation?.createdAt || ""),
    reviewed: true,
    status: "active",
    salesChannels: [],
    attachment: operation?.hasAttachment ? { kind: "image", name: "attachment" } : null,
  };
}

export function mapNotebookExportToShareData(
  payload: Record<string, unknown> | null | undefined,
  snapshot: ExportSnapshot | null | undefined,
): NotebookExportShareData | null {
  if (!payload || typeof payload !== "object") return null;

  const businessId = String(snapshot?.selectedBusiness || payload.storeId || "");
  const totals = (payload.totals && typeof payload.totals === "object"
    ? payload.totals as Record<string, unknown>
    : {});
  const record = {
    sales: Number(totals.sales) || 0,
    expense: Number(totals.expense) || 0,
    net: Number(totals.net) || 0,
    ratio: typeof totals.ratio === "string" ? totals.ratio : "0.0%",
    proofs: Number(totals.proofs) || 0,
  };

  const entries = (Array.isArray(payload.operations) ? payload.operations : [])
    .map((operation) => mapNotebookExportOperationToEntry(operation as Record<string, unknown>, businessId));

  const shareChannelRows = (Array.isArray(payload.channels) ? payload.channels : [])
    .filter((row) => Number((row as Record<string, unknown>)?.amount) > 0)
    .map((row) => {
      const channel = row as Record<string, unknown>;
      return {
        id: String(channel.channelId || channel.id || ""),
        label: String(channel.name || channel.channelId || ""),
        amount: Number(channel.amount) || 0,
      };
    });

  const dayTotals = new Map<string, { sales: number; expense: number }>();
  entries.forEach((entry) => {
    if (!entry.date) return;
    const current = dayTotals.get(entry.date) || { sales: 0, expense: 0 };
    if (entry.type === "summary") current.sales += Number(entry.amount) || 0;
    if (entry.type && OUTFLOW_TYPES.has(entry.type)) current.expense += Number(entry.amount) || 0;
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
  };
}
