import {
  entryIsActive,
  entryIsOutflow,
} from "@/features/operations/operational-analytics";
import { formatCalendarDate, formatSelectedMonth } from "@/features/reports/client/report-period-labels";
import { formatDisplayMoneyFromRiyals } from "@/core/money/format-display-money";
import {
  formatRegisterReportRowLabel,
  registerReportGranularityColumnLabel,
  registerReportGranularitySheetName,
  resolveRegisterReportGranularityFromSnapshot,
} from "@/features/reports/client/register-report-granularity";
import { buildRegisterReportExportRows } from "@/features/entries/client/register-log-display";
import {
  businessName,
  text,
  outflowReportCategories,
} from "@/components/taqfeelah-app/taqfeelah-app-demo-data";
import {
  entryCategory,
  entryDateMatches,
  entryHasAttachment,
  operationDisplayLabel,
  signedEntryAmount,
} from "@/components/taqfeelah-app/taqfeelah-app-entry-helpers";
import { todayIsoDate } from "@/components/taqfeelah-app/taqfeelah-app-notebook";
import { buildNotebookShareModel } from "@/components/taqfeelah-app/build-notebook-share-model";
import type { PrototypeBusiness } from "@/components/taqfeelah-app/taqfeelah-app-types";
import type {
  NotebookShareChannelRow,
  NotebookShareDayRow,
  PrototypeStoreRecord,
} from "@/components/taqfeelah-app/taqfeelah-app-types";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import type {
  BuildDataExportModelInput,
  DataExportModel,
  ExportApiExtras,
  ExportBusiness,
  ExportColumn,
  ExportSheet,
  ExportSheetRow,
  ExportSnapshot,
} from "@/features/exports/client/exports-client-types";
import { exportColumn } from "@/features/exports/client/exports-client-types";

function resolvePeriodLabel(snapshot: ExportSnapshot, lang: DisplayLang): string {
  const sharePeriod = snapshot.period || "day";
  const shareDate = snapshot.selectedDate || todayIsoDate();
  const shareYear = snapshot.selectedYear || String(new Date().getFullYear());
  const shareFrom = snapshot.customFrom || `${shareYear}-01-01`;
  const shareTo = snapshot.customTo || todayIsoDate();
  if (sharePeriod === "year") return shareYear;
  if (sharePeriod === "custom") {
    return `${formatCalendarDate(shareFrom, lang)} — ${formatCalendarDate(shareTo, lang)}`;
  }
  if (sharePeriod === "month") return formatSelectedMonth(snapshot.selectedMonth ?? "", lang);
  return formatCalendarDate(shareDate, lang);
}

function resolveStoreTitle(snapshot: ExportSnapshot, lang: DisplayLang, businessesList: ExportBusiness[]): string {
  if (snapshot.selectedBusiness === "all") {
    return text(lang, snapshot.screen === "register" ? "combinedCloseout" : "combinedCloseout");
  }
  const business = businessesList.find((item) => item.id === snapshot.selectedBusiness) || businessesList[0];
  return business ? businessName(business as PrototypeBusiness, lang) : text(lang, "store");
}

function entryTypeLabel(entry: OperationalEntry, lang: DisplayLang): string {
  if (entry.type === "summary") return text(lang, "sales");
  if (entry.type === "purchases") return text(lang, "purchases");
  if (entry.type === "withdrawal") return text(lang, "withdrawal");
  if (entry.type === "expense") return text(lang, entryCategory(entry));
  return entry.type || "";
}

function includeStoreColumn(snapshot: ExportSnapshot): boolean {
  return snapshot.selectedBusiness === "all" || (snapshot.includedBusinessIds?.length || 0) > 1;
}

function storeCell(
  snapshot: ExportSnapshot,
  businessId: string | undefined,
  businessesList: ExportBusiness[],
  lang: DisplayLang,
): string {
  const business = businessesList.find((item) => item.id === businessId);
  return business ? businessName(business as PrototypeBusiness, lang) : businessId || "";
}

function buildHomeExportSheets(
  snapshot: ExportSnapshot,
  lang: DisplayLang,
  businessesList: ExportBusiness[],
  operationalEntries: OperationalEntry[],
  archivedBusinessIds: string[],
  apiExtras: ExportApiExtras,
): { sheets: ExportSheet[]; shareModel: Record<string, unknown> | null } {
  const shareModel = buildNotebookShareModel({
    snapshot,
    lang,
    businessesList: businessesList as PrototypeBusiness[],
    operationalEntries,
    archivedBusinessIds,
    apiEntries: apiExtras.apiEntries ?? undefined,
    apiRecord: (apiExtras.apiRecord ?? undefined) as PrototypeStoreRecord | null | undefined,
    apiChannelRows: (apiExtras.apiChannelRows ?? undefined) as NotebookShareChannelRow[] | null | undefined,
    apiDayRows: (apiExtras.apiDayRows ?? undefined) as NotebookShareDayRow[] | null | undefined,
  }) as Record<string, unknown> & {
    shareBusinessRows?: Array<{ business?: ExportBusiness; sales?: number; expense?: number; net?: number }>;
    record?: { sales?: number; expense?: number; net?: number };
    shareChannelRows?: Array<{ label?: string; name?: string; id?: string; amount?: number }>;
  };
  const shareRecord = shareModel.record ?? { sales: 0, expense: 0, net: 0 };
  const sheets: ExportSheet[] = [];
  const combined = snapshot.selectedBusiness === "all";
  const withStore = includeStoreColumn(snapshot);

  if (combined && shareModel.shareBusinessRows?.length) {
    const columns: ExportColumn[] = [
      ...(withStore ? [exportColumn("store", text(lang, "store"), "text")] : []),
      exportColumn("sales", text(lang, "sales"), "number", true),
      exportColumn("expense", text(lang, "purchasesExpenses"), "number", true),
      exportColumn("net", text(lang, "result"), "number", true),
    ];
    const rows = shareModel.shareBusinessRows.map((row) => ({
      ...(withStore ? { store: businessName(row.business as PrototypeBusiness, lang) } : {}),
      sales: Number(row.sales) || 0,
      expense: Number(row.expense) || 0,
      net: Number(row.net) || 0,
    }));
    rows.push({
      ...(withStore ? { store: text(lang, "combinedTotal") } : {}),
      sales: Number(shareRecord.sales) || 0,
      expense: Number(shareRecord.expense) || 0,
      net: Number(shareRecord.net) || 0,
    });
    sheets.push({
      name: lang === "ar" ? "ملخص المحلات" : "Stores summary",
      columns,
      rows,
    });
  } else {
    const columns: ExportColumn[] = [
      exportColumn("metric", lang === "ar" ? "البند" : "Metric", "text"),
      exportColumn("amount", lang === "ar" ? "المبلغ" : "Amount", "number", false),
    ];
    sheets.push({
      name: lang === "ar" ? "ملخص" : "Summary",
      columns,
      rows: [
        { metric: text(lang, "sales"), amount: Number(shareRecord.sales) || 0 },
        { metric: text(lang, "purchasesExpenses"), amount: Number(shareRecord.expense) || 0 },
        { metric: text(lang, "result"), amount: Number(shareRecord.net) || 0 },
      ],
    });
  }

  if (shareModel.shareChannelRows?.length) {
    sheets.push({
      name: text(lang, "paymentMethods"),
      columns: [
        exportColumn("channel", text(lang, "channels"), "text"),
        exportColumn("amount", lang === "ar" ? "المبلغ" : "Amount", "number", true),
      ],
      rows: shareModel.shareChannelRows.map((row) => ({
        channel: String(row.label || row.name || row.id || ""),
        amount: Number(row.amount) || 0,
      })),
    });
  }

  const scopedEntries = (apiExtras.apiEntries || operationalEntries).filter((entry) => {
    const ids = snapshot.includedBusinessIds || businessesList.map((business) => business.id);
    const inScope = combined ? ids.includes(entry.businessId) : entry.businessId === snapshot.selectedBusiness;
    return inScope && entryIsActive(entry) && entryIsOutflow(entry);
  });
  if (scopedEntries.length) {
    const categoryTotals = outflowReportCategories
      .filter((item) => item.id !== "all")
      .map((item) => ({
        category: text(lang, item.label),
        amount: scopedEntries
          .filter((entry) => entryCategory(entry) === item.id)
          .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0),
      }))
      .filter((row) => row.amount > 0);
    if (categoryTotals.length) {
      sheets.push({
        name: lang === "ar" ? "بنود الخارج" : "Outflow",
        columns: [
          exportColumn("category", lang === "ar" ? "البند" : "Category", "text"),
          exportColumn("amount", lang === "ar" ? "المبلغ" : "Amount", "number", true),
        ],
        rows: categoryTotals,
      });
    }
  }

  return { shareModel, sheets };
}

function buildRegisterOperationsSheet(
  snapshot: ExportSnapshot,
  lang: DisplayLang,
  businessesList: ExportBusiness[],
  serverEntries: OperationalEntry[] | null = null,
): ExportSheet {
  const exportData = snapshot.exportData as Record<string, unknown> | undefined;
  const entries = serverEntries?.length
    ? serverEntries
    : (exportData?.visibleEntries as OperationalEntry[] | undefined) || [];
  if (exportData?.requiresServerExport && !serverEntries?.length) {
    return {
      name: lang === "ar" ? "العمليات" : "Operations",
      columns: [exportColumn("message", lang === "ar" ? "الحالة" : "Status", "text")],
      rows: [{
        message: lang === "ar"
          ? "تصدير العمليات للفترة المحددة يتطلب تصديرًا خادميًا كاملًا، ولا يستخدم بيانات الشاشة الجزئية."
          : "Operations export for the selected period requires a complete server export and does not use partial screen data.",
      }],
    };
  }
  const withStore = includeStoreColumn(snapshot);
  return {
    name: lang === "ar" ? "العمليات" : "Operations",
    columns: [
      ...(withStore ? [exportColumn("store", text(lang, "store"), "text")] : []),
      exportColumn("date", lang === "ar" ? "التاريخ" : "Date", "date"),
      exportColumn("type", lang === "ar" ? "النوع" : "Type", "text"),
      exportColumn("label", lang === "ar" ? "البيان" : "Label", "text"),
      exportColumn("amount", lang === "ar" ? "المبلغ" : "Amount", "number", true),
      exportColumn("note", lang === "ar" ? "ملاحظة" : "Note", "text"),
      exportColumn("attachment", lang === "ar" ? "مرفق" : "Attachment", "text"),
    ],
    rows: entries.map((entry) => ({
      ...(withStore ? { store: storeCell(snapshot, entry.businessId, businessesList, lang) } : {}),
      date: formatCalendarDate(entry.date ?? "", lang),
      type: entryTypeLabel(entry, lang),
      label: operationDisplayLabel(entry, lang),
      amount: Number(signedEntryAmount(entry)) || 0,
      note: entry.note || "",
      attachment: entryHasAttachment(entry) ? text(lang, "attachmentExists") : text(lang, "noAttachment"),
    })),
  };
}

function buildRegisterCloseoutsSheet(
  snapshot: ExportSnapshot,
  lang: DisplayLang,
  businessesList: ExportBusiness[],
): ExportSheet {
  const exportData = snapshot.exportData as Record<string, unknown> | undefined;
  const summaries = (exportData?.closeoutSummaries as Array<Record<string, unknown>> | undefined) || [];
  const withStore = includeStoreColumn(snapshot);
  return {
    name: lang === "ar" ? "التقفيلات" : "Closeouts",
    columns: [
      ...(withStore ? [exportColumn("store", text(lang, "store"), "text")] : []),
      exportColumn("date", lang === "ar" ? "التاريخ" : "Date", "date"),
      exportColumn("closeout", lang === "ar" ? "التقفيل" : "Closeout", "text"),
      exportColumn("actor", lang === "ar" ? "الموظف" : "Employee", "text"),
      exportColumn("sales", text(lang, "sales"), "number", true),
      exportColumn("expense", text(lang, "purchasesExpenses"), "number", true),
      exportColumn("net", text(lang, "result"), "number", true),
    ],
    rows: summaries.map((summary) => {
      const totals = (summary.totals && typeof summary.totals === "object"
        ? summary.totals as Record<string, unknown>
        : {});
      const store = summary.store as ExportBusiness | undefined;
      return {
        ...(withStore ? {
          store: store
            ? businessName(store as PrototypeBusiness, lang)
            : storeCell(snapshot, String(summary.businessId || ""), businessesList, lang),
        } : {}),
        date: formatCalendarDate(String(summary.date || ""), lang),
        closeout: summary.daySequence ? `#${String(summary.daySequence)}` : "—",
        actor: String(summary.actorLabel || ""),
        sales: Number(totals.sales) || 0,
        expense: Number(totals.expense) || 0,
        net: Number(totals.net) || 0,
      } satisfies ExportSheetRow;
    }),
  };
}

function buildRegisterReportExportSnapshotRows(
  snapshot: ExportSnapshot,
  lang: DisplayLang,
  businessesList: ExportBusiness[],
  operationalEntries: OperationalEntry[],
) {
  const exportData = snapshot.exportData as Record<string, unknown> | undefined;
  const sharePeriod = snapshot.period || "month";
  const shareDate = snapshot.selectedDate || todayIsoDate();
  const shareYear = snapshot.selectedYear || String(new Date().getFullYear());
  const shareFrom = snapshot.customFrom || `${shareYear}-01-01`;
  const shareTo = snapshot.customTo || todayIsoDate();
  const ids = snapshot.includedBusinessIds || businessesList.map((business) => business.id);
  const scoped = ((exportData?.periodEntries as OperationalEntry[] | undefined) || operationalEntries).filter(
    (entry) => ids.includes(entry.businessId)
      && entryIsActive(entry)
      && entryDateMatches(entry, sharePeriod, shareDate, snapshot.selectedMonth ?? "", shareYear, shareFrom, shareTo),
  );
  const withStore = includeStoreColumn(snapshot);
  const granularity = resolveRegisterReportGranularityFromSnapshot(snapshot);

  return buildRegisterReportExportRows({
    entries: scoped,
    granularity,
    withStore,
    formatStore: (businessId) => storeCell(snapshot, businessId, businessesList, lang),
  });
}

function buildRegisterAttachmentsSheet(
  snapshot: ExportSnapshot,
  lang: DisplayLang,
  businessesList: ExportBusiness[],
  serverEntries: OperationalEntry[] | null = null,
): ExportSheet {
  const exportData = snapshot.exportData as Record<string, unknown> | undefined;
  if (exportData?.requiresServerExport && !serverEntries?.length) {
    return {
      name: text(lang, "attachments"),
      columns: [exportColumn("message", lang === "ar" ? "الحالة" : "Status", "text")],
      rows: [{
        message: lang === "ar"
          ? "تصدير مرفقات الفترة المحددة يتطلب تصديرًا خادميًا كاملًا، ولا يستخدم بيانات الشاشة الجزئية."
          : "Attachments export for the selected period requires a complete server export and does not use partial screen data.",
      }],
    };
  }
  const items = serverEntries?.length
    ? serverEntries
      .filter((entry) => entryIsOutflow(entry) && entryHasAttachment(entry))
      .map((entry) => ({
        businessId: entry.businessId,
        date: entry.date,
        label: operationDisplayLabel(entry, lang),
        labelEn: operationDisplayLabel(entry, "en"),
        amount: Number(entry.amount) || 0,
        voided: false,
      }))
    : (exportData?.attachmentGalleryItems as Array<Record<string, unknown>> | undefined) || [];
  const withStore = includeStoreColumn(snapshot);
  return {
    name: text(lang, "attachments"),
    columns: [
      ...(withStore ? [exportColumn("store", text(lang, "store"), "text")] : []),
      exportColumn("date", lang === "ar" ? "التاريخ" : "Date", "date"),
      exportColumn("label", lang === "ar" ? "البيان" : "Label", "text"),
      exportColumn("amount", lang === "ar" ? "المبلغ" : "Amount", "number", true),
      exportColumn("status", lang === "ar" ? "الحالة" : "Status", "text"),
    ],
    rows: items.map((item) => ({
      ...(withStore ? { store: storeCell(snapshot, String(item.businessId || ""), businessesList, lang) } : {}),
      date: formatCalendarDate(String(item.date || ""), lang),
      label: String(lang === "ar" ? item.label : item.labelEn),
      amount: -(Number(item.amount) || 0),
      status: item.voided ? text(lang, "voided") : text(lang, "active"),
    })),
  };
}

function buildRegisterExportSheets(
  snapshot: ExportSnapshot,
  lang: DisplayLang,
  businessesList: ExportBusiness[],
  operationalEntries: OperationalEntry[],
  apiEntries: OperationalEntry[] | null = null,
  apiDayRows: Array<Record<string, unknown>> | null = null,
): { sheets: ExportSheet[] } {
  const exportData = snapshot.exportData as Record<string, unknown> | undefined;
  const view = String(snapshot.registerView || "report");
  const sheets: ExportSheet[] = [];
  if (view === "operations") sheets.push(buildRegisterOperationsSheet(snapshot, lang, businessesList, apiEntries));
  if (view === "closeouts") sheets.push(buildRegisterCloseoutsSheet(snapshot, lang, businessesList));
  if (view === "attachments") sheets.push(buildRegisterAttachmentsSheet(snapshot, lang, businessesList, apiEntries));
  if (view === "report") {
    if (exportData?.requiresServerExport && !apiDayRows?.length) {
      sheets.push({
        name: lang === "ar" ? "تقرير عام" : "General report",
        columns: [exportColumn("message", lang === "ar" ? "الحالة" : "Status", "text")],
        rows: [{
          message: lang === "ar"
            ? "تصدير التقرير للفترة المحددة يتطلب تصديرًا خادميًا كاملًا، ولا يستخدم بيانات الشاشة الجزئية."
            : "Report export for the selected period requires a complete server export and does not use partial screen data.",
        }],
      });
      return { sheets };
    }
    const withStore = includeStoreColumn(snapshot);
    const granularity = resolveRegisterReportGranularityFromSnapshot(snapshot);
    const apiReportRows = apiDayRows?.length ? apiDayRows : null;
    const rows = apiReportRows
      ? apiReportRows.map((row) => ({
        date: formatRegisterReportRowLabel(String(row.date ?? ""), granularity, lang),
        sales: Number(row.sales) || 0,
        expense: Number(row.expense) || 0,
        net: Number(row.net) || 0,
      }))
      : withStore || !(exportData?.generalReportRows as unknown[] | undefined)?.length
      ? buildRegisterReportExportSnapshotRows(snapshot, lang, businessesList, operationalEntries).map((row) => ({
        ...(withStore ? { store: row.store } : {}),
        date: formatRegisterReportRowLabel(row.date, granularity, lang),
        sales: Number(row.sales) || 0,
        expense: Number(row.expense) || 0,
        net: Number(row.net) || 0,
      }))
      : (exportData?.generalReportRows as Array<Record<string, unknown>>).map((row) => ({
        ...(withStore && row.store ? { store: String(row.store) } : {}),
        date: formatRegisterReportRowLabel(String(row.date ?? ""), granularity, lang),
        sales: Number(row.sales) || 0,
        expense: Number(row.expense) || 0,
        net: Number(row.net) || 0,
      }));
    sheets.push({
      name: registerReportGranularitySheetName(granularity, lang),
      columns: [
        ...(includeStoreColumn(snapshot) ? [exportColumn("store", text(lang, "store"), "text")] : []),
        exportColumn("date", registerReportGranularityColumnLabel(granularity, lang), "date"),
        exportColumn("sales", text(lang, "sales"), "number", true),
        exportColumn("expense", text(lang, "purchasesExpenses"), "number", true),
        exportColumn("net", text(lang, "result"), "number", true),
      ],
      rows,
    });
  }
  return { sheets };
}

function registerViewLabel(view: string, lang: DisplayLang): string {
  if (view === "operations") return lang === "ar" ? "العمليات" : "Operations";
  if (view === "closeouts") return lang === "ar" ? "التقفيلات" : "Closeouts";
  if (view === "attachments") return text(lang, "attachments");
  return lang === "ar" ? "تقرير عام" : "General report";
}

export function buildDataExportModel({
  snapshot,
  lang,
  businessesList = [],
  operationalEntries = [],
  archivedBusinessIds = [],
  apiEntries = null,
  apiRecord = null,
  apiChannelRows = null,
  apiDayRows = null,
}: BuildDataExportModelInput): DataExportModel | null {
  if (!snapshot) return null;

  const periodLabel = resolvePeriodLabel(snapshot, lang);
  const storeName = resolveStoreTitle(snapshot, lang, businessesList);
  const exportedAt = formatCalendarDate(todayIsoDate(), lang);
  const meta = {
    title: snapshot.screen === "register"
      ? text(lang, "operationsLog")
      : snapshot.screen === "reports"
        ? text(lang, "reportNotebook")
        : text(lang, snapshot.period === "month" ? "monthlySummary" : "dailySummary"),
    storeLabel: text(lang, "store"),
    storeName,
    periodLabel,
    exportedAt,
    viewLabel: snapshot.screen === "register" ? registerViewLabel(String(snapshot.registerView || ""), lang) : undefined,
  };

  let sheets: ExportSheet[] = [];
  let shareModel: Record<string, unknown> | null = null;
  if (snapshot.screen === "register") {
    ({ sheets } = buildRegisterExportSheets(snapshot, lang, businessesList, operationalEntries, apiEntries, apiDayRows));
  } else {
    ({ sheets, shareModel } = buildHomeExportSheets(snapshot, lang, businessesList, operationalEntries, archivedBusinessIds, {
      apiEntries,
      apiRecord,
      apiChannelRows,
      apiDayRows,
    }));
  }

  const safeExportName = [
    lang === "ar" ? "تقفيلة" : "Taqfeelah",
    snapshot.screen,
    snapshot.registerView || "",
    snapshot.selectedDate || todayIsoDate(),
  ].filter(Boolean).join("-").replace(/[^\w\u0600-\u06FF.-]+/g, "-");

  const previewTable = sheets[0]
    ? {
      headers: sheets[0].columns.map((column) => column.label),
      rows: sheets[0].rows.map((row) => sheets[0].columns.map((column) => {
        const value = row[column.key];
        if (column.type === "number" && typeof value === "number") {
          return formatDisplayMoneyFromRiyals(value, lang);
        }
        return String(value ?? "");
      })),
    }
    : { headers: [], rows: [] };

  return {
    meta,
    sheets,
    safeExportName,
    previewTable,
    title: storeName,
    periodLabel,
    combined: snapshot.selectedBusiness === "all",
    shareModel: shareModel ?? undefined,
  };
}
