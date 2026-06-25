import { resolveReportDateRange } from "@/features/reports/client/report-period-range";
import { summarizeEntries } from "@/features/operations/operational-analytics";
import { resolveOperationalEntrySalesAmount } from "@/features/entries/client/resolve-operational-entry-amount";
import type {
  OperationalEntry,
  OperationalEntrySalesChannelRow,
} from "@/features/entries/client/entries-client-types";
import type { ExportSnapshot } from "@/features/exports/client/exports-client-types";
import type {
  NotebookExportRequest,
  NotebookExportShareData,
} from "@/features/exports-attachments/client/exports-attachments-client-types";

export function canFetchNotebookExportForSnapshot(snapshot: ExportSnapshot | null | undefined, enabled: boolean) {
  if (!enabled || !snapshot || typeof snapshot !== "object") return false;
  if (snapshot.screen === "register") {
    const view = String(snapshot.registerView || "");
    if (view === "closeouts") return false;
    if (view === "report") {
      const exportData = snapshot.exportData as Record<string, unknown> | undefined;
      return Boolean(exportData?.requiresServerExport);
    }
    if (view !== "operations" && view !== "attachments") return false;
  }
  if (snapshot.selectedBusiness === "all") return (snapshot.includedBusinessIds?.length || 0) > 0;
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

export function buildNotebookExportRequests(snapshot: ExportSnapshot): NotebookExportRequest[] {
  if (snapshot.selectedBusiness !== "all") return [buildNotebookExportRequest(snapshot)];
  return (snapshot.includedBusinessIds || [])
    .filter(Boolean)
    .map((storeId) => buildNotebookExportRequest({
      ...snapshot,
      selectedBusiness: storeId,
      includedBusinessIds: [storeId],
    }));
}

function mapNotebookExportSalesChannels(
  operation: Record<string, unknown>,
): OperationalEntrySalesChannelRow[] {
  const raw = operation.salesChannels;
  if (!Array.isArray(raw)) return [];
  const mapped: OperationalEntrySalesChannelRow[] = [];
  raw.forEach((row) => {
    const channel = row as Record<string, unknown>;
    const channelId = typeof channel.channelId === "string"
      ? channel.channelId
      : typeof channel.id === "string"
        ? channel.id
        : "";
    const amount = Number(channel.amount ?? 0);
    if (!channelId || amount <= 0) return;
    mapped.push({
      channelId,
      amount,
      name: typeof channel.name === "string" ? channel.name : undefined,
    });
  });
  return mapped;
}

export function mapNotebookExportOperationToEntry(
  operation: Record<string, unknown>,
  businessId: string,
): OperationalEntry {
  const salesChannels = mapNotebookExportSalesChannels(operation);
  const type = String(operation?.type || "summary");
  const amount = Number(operation?.amount) || 0;
  return {
    id: String(operation?.id || `op-${operation?.date || "unknown"}`),
    businessId,
    date: String(operation?.date || ""),
    type,
    amount: type === "summary" && salesChannels.length > 0
      ? resolveOperationalEntrySalesAmount({ type, amount, salesChannels })
      : amount,
    note: String(operation?.note || ""),
    createdAt: String(operation?.createdAt || ""),
    reviewed: true,
    status: "active",
    salesChannels,
    attachment: operation?.hasAttachment ? { kind: "image", name: "attachment" } : null,
  };
}

export function mapNotebookExportToShareData(
  payload: Record<string, unknown> | null | undefined,
  snapshot: ExportSnapshot | null | undefined,
): NotebookExportShareData | null {
  if (!payload || typeof payload !== "object") return null;

  const businessId = String(snapshot?.selectedBusiness === "all"
    ? payload.storeId || ""
    : snapshot?.selectedBusiness || payload.storeId || "");
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

  const dayTotals = new Map<string, ReturnType<typeof summarizeEntries>>();
  entries.forEach((entry) => {
    if (!entry.date) return;
    const scoped = entries.filter((item) => item.date === entry.date);
    dayTotals.set(entry.date, summarizeEntries(scoped));
  });

  const shareDayRows = [...dayTotals.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, values]) => ({
      date,
      sales: values.sales,
      expense: values.expense,
      net: values.net,
    }));

  return {
    entries,
    record,
    shareChannelRows,
    shareDayRows,
    proofs: record.proofs,
  };
}

export function combineNotebookExportShareData(items: Array<NotebookExportShareData | null>): NotebookExportShareData | null {
  const validItems = items.filter(Boolean) as NotebookExportShareData[];
  if (!validItems.length) return null;
  const entries = validItems.flatMap((item) => item.entries);
  const recordTotals = summarizeEntries(entries);
  const channels = new Map<string, { id?: string; label: string; amount: number }>();
  validItems.forEach((item) => {
    item.shareChannelRows.forEach((row) => {
      const key = row.id || row.label;
      const current = channels.get(key) || { id: row.id, label: row.label, amount: 0 };
      channels.set(key, {
        ...current,
        amount: current.amount + (Number(row.amount) || 0),
      });
    });
  });
  const dayTotals = new Map<string, ReturnType<typeof summarizeEntries>>();
  entries.forEach((entry) => {
    if (!entry.date || dayTotals.has(entry.date)) return;
    dayTotals.set(entry.date, summarizeEntries(entries.filter((item) => item.date === entry.date)));
  });
  return {
    entries,
    record: {
      sales: recordTotals.sales,
      expense: recordTotals.expense,
      net: recordTotals.net,
      ratio: recordTotals.ratio,
      proofs: recordTotals.proofs,
    },
    shareChannelRows: [...channels.values()].filter((row) => row.amount > 0),
    shareDayRows: [...dayTotals.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, totals]) => ({
        date,
        sales: totals.sales,
        expense: totals.expense,
        net: totals.net,
      })),
    proofs: recordTotals.proofs,
  };
}
