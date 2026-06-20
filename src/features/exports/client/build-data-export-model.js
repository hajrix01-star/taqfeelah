import {
  entryIsActive,
  entryIsOutflow,
} from "@/features/operations/operational-analytics";
import { formatCalendarDate, formatSelectedMonth } from "@/features/reports/client/report-period-labels";
import {
  formatRegisterReportRowLabel,
  registerReportGranularityColumnLabel,
  registerReportGranularitySheetName,
  resolveRegisterReportGranularity,
} from "@/features/reports/client/register-report-granularity";
import { buildRegisterReportExportRows } from "@/features/entries/client/register-log-display";
import {
  businessName,
  text,
  outflowReportCategories,
} from "@/components/prototype-runtime/prototype-runtime-demo-data";
import {
  entryCategory,
  entryDateMatches,
  entryHasAttachment,
  operationDisplayLabel,
  signedEntryAmount,
} from "@/components/prototype-runtime/prototype-runtime-entry-helpers";
import { todayIsoDate } from "@/components/prototype-runtime/prototype-runtime-notebook";
import { buildNotebookShareModel } from "@/components/prototype-runtime/build-notebook-share-model";

/**
 * @typedef {"text" | "number" | "date"} ExportColumnType
 * @typedef {{ key: string, label: string, type: ExportColumnType, sum?: boolean }} ExportColumn
 * @typedef {{ name: string, columns: ExportColumn[], rows: Record<string, string | number | null>[] }} ExportSheet
 * @typedef {{ title: string, storeLabel: string, storeName: string, periodLabel: string, exportedAt: string, viewLabel?: string }} ExportMeta
 */

function resolvePeriodLabel(snapshot, lang) {
  const sharePeriod = snapshot.period || "day";
  const shareDate = snapshot.selectedDate || todayIsoDate();
  const shareYear = snapshot.selectedYear || String(new Date().getFullYear());
  const shareFrom = snapshot.customFrom || `${shareYear}-01-01`;
  const shareTo = snapshot.customTo || todayIsoDate();
  if (sharePeriod === "year") return shareYear;
  if (sharePeriod === "custom") {
    return `${formatCalendarDate(shareFrom, lang)} — ${formatCalendarDate(shareTo, lang)}`;
  }
  if (sharePeriod === "month") return formatSelectedMonth(snapshot.selectedMonth, lang);
  return formatCalendarDate(shareDate, lang);
}

function resolveStoreTitle(snapshot, lang, businessesList) {
  if (snapshot.selectedBusiness === "all") {
    return text(lang, snapshot.screen === "register" ? "combinedCloseout" : "combinedCloseout");
  }
  const business = businessesList.find((item) => item.id === snapshot.selectedBusiness) || businessesList[0];
  return business ? businessName(business, lang) : text(lang, "store");
}

function entryTypeLabel(entry, lang) {
  if (entry.type === "summary") return text(lang, "sales");
  if (entry.type === "purchases") return text(lang, "purchases");
  if (entry.type === "withdrawal") return text(lang, "withdrawal");
  if (entry.type === "expense") return text(lang, entryCategory(entry));
  return entry.type || "";
}

function includeStoreColumn(snapshot) {
  return snapshot.selectedBusiness === "all" || (snapshot.includedBusinessIds?.length || 0) > 1;
}

function storeCell(snapshot, businessId, businessesList, lang) {
  const business = businessesList.find((item) => item.id === businessId);
  return business ? businessName(business, lang) : businessId || "";
}

function buildHomeExportSheets(snapshot, lang, businessesList, operationalEntries, archivedBusinessIds, apiExtras) {
  const shareModel = buildNotebookShareModel({
    snapshot,
    lang,
    businessesList,
    operationalEntries,
    archivedBusinessIds,
    ...apiExtras,
  });
  const sheets = [];
  const combined = snapshot.selectedBusiness === "all";
  const withStore = includeStoreColumn(snapshot);

  if (combined && shareModel.shareBusinessRows?.length) {
    const columns = [
      ...(withStore ? [{ key: "store", label: text(lang, "store"), type: "text" }] : []),
      { key: "sales", label: text(lang, "sales"), type: "number", sum: true },
      { key: "expense", label: text(lang, "purchasesExpenses"), type: "number", sum: true },
      { key: "net", label: text(lang, "result"), type: "number", sum: true },
    ];
    const rows = shareModel.shareBusinessRows.map((row) => ({
      ...(withStore ? { store: businessName(row.business, lang) } : {}),
      sales: Number(row.sales) || 0,
      expense: Number(row.expense) || 0,
      net: Number(row.net) || 0,
    }));
    rows.push({
      ...(withStore ? { store: text(lang, "combinedTotal") } : {}),
      sales: Number(shareModel.record.sales) || 0,
      expense: Number(shareModel.record.expense) || 0,
      net: Number(shareModel.record.net) || 0,
    });
    sheets.push({
      name: lang === "ar" ? "ملخص المحلات" : "Stores summary",
      columns,
      rows,
    });
  } else {
    const columns = [
      { key: "metric", label: lang === "ar" ? "البند" : "Metric", type: "text" },
      { key: "amount", label: lang === "ar" ? "المبلغ" : "Amount", type: "number", sum: false },
    ];
    sheets.push({
      name: lang === "ar" ? "ملخص" : "Summary",
      columns,
      rows: [
        { metric: text(lang, "sales"), amount: Number(shareModel.record.sales) || 0 },
        { metric: text(lang, "purchasesExpenses"), amount: Number(shareModel.record.expense) || 0 },
        { metric: text(lang, "result"), amount: Number(shareModel.record.net) || 0 },
      ],
    });
  }

  if (shareModel.shareChannelRows?.length) {
    sheets.push({
      name: text(lang, "paymentMethods"),
      columns: [
        { key: "channel", label: text(lang, "channels"), type: "text" },
        { key: "amount", label: lang === "ar" ? "المبلغ" : "Amount", type: "number", sum: true },
      ],
      rows: shareModel.shareChannelRows.map((row) => ({
        channel: row.label || row.name || row.id,
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
          { key: "category", label: lang === "ar" ? "البند" : "Category", type: "text" },
          { key: "amount", label: lang === "ar" ? "المبلغ" : "Amount", type: "number", sum: true },
        ],
        rows: categoryTotals,
      });
    }
  }

  return { shareModel, sheets };
}

function buildRegisterOperationsSheet(snapshot, lang, businessesList) {
  const entries = snapshot.exportData?.visibleEntries || [];
  const withStore = includeStoreColumn(snapshot);
  return {
    name: lang === "ar" ? "العمليات" : "Operations",
    columns: [
      ...(withStore ? [{ key: "store", label: text(lang, "store"), type: "text" }] : []),
      { key: "date", label: lang === "ar" ? "التاريخ" : "Date", type: "date" },
      { key: "type", label: lang === "ar" ? "النوع" : "Type", type: "text" },
      { key: "label", label: lang === "ar" ? "البيان" : "Label", type: "text" },
      { key: "amount", label: lang === "ar" ? "المبلغ" : "Amount", type: "number", sum: true },
      { key: "note", label: lang === "ar" ? "ملاحظة" : "Note", type: "text" },
      { key: "attachment", label: lang === "ar" ? "مرفق" : "Attachment", type: "text" },
    ],
    rows: entries.map((entry) => ({
      ...(withStore ? { store: storeCell(snapshot, entry.businessId, businessesList, lang) } : {}),
      date: formatCalendarDate(entry.date, lang),
      type: entryTypeLabel(entry, lang),
      label: operationDisplayLabel(entry, lang),
      amount: Number(signedEntryAmount(entry)) || 0,
      note: entry.note || "",
      attachment: entryHasAttachment(entry) ? text(lang, "attachmentExists") : text(lang, "noAttachment"),
    })),
  };
}

function buildRegisterCloseoutsSheet(snapshot, lang, businessesList) {
  const summaries = snapshot.exportData?.closeoutSummaries || [];
  const withStore = includeStoreColumn(snapshot);
  return {
    name: lang === "ar" ? "التقفيلات" : "Closeouts",
    columns: [
      ...(withStore ? [{ key: "store", label: text(lang, "store"), type: "text" }] : []),
      { key: "date", label: lang === "ar" ? "التاريخ" : "Date", type: "date" },
      { key: "closeout", label: lang === "ar" ? "التقفيل" : "Closeout", type: "text" },
      { key: "actor", label: lang === "ar" ? "الموظف" : "Employee", type: "text" },
      { key: "sales", label: text(lang, "sales"), type: "number", sum: true },
      { key: "expense", label: text(lang, "purchasesExpenses"), type: "number", sum: true },
      { key: "net", label: text(lang, "result"), type: "number", sum: true },
    ],
    rows: summaries.map((summary) => ({
      ...(withStore ? { store: summary.store ? businessName(summary.store, lang) : storeCell(snapshot, summary.businessId, businessesList, lang) } : {}),
      date: formatCalendarDate(summary.date, lang),
      closeout: summary.daySequence ? `#${summary.daySequence}` : "—",
      actor: summary.actorLabel || "",
      sales: Number(summary.totals?.sales) || 0,
      expense: Number(summary.totals?.expense) || 0,
      net: Number(summary.totals?.net) || 0,
    })),
  };
}

function buildRegisterReportRows(snapshot, lang, businessesList, operationalEntries) {
  const sharePeriod = snapshot.period || "month";
  const shareDate = snapshot.selectedDate || todayIsoDate();
  const shareYear = snapshot.selectedYear || String(new Date().getFullYear());
  const shareFrom = snapshot.customFrom || `${shareYear}-01-01`;
  const shareTo = snapshot.customTo || todayIsoDate();
  const ids = snapshot.includedBusinessIds || businessesList.map((business) => business.id);
  const scoped = (snapshot.exportData?.periodEntries || operationalEntries).filter(
    (entry) => ids.includes(entry.businessId)
      && entryIsActive(entry)
      && entryDateMatches(entry, sharePeriod, shareDate, snapshot.selectedMonth, shareYear, shareFrom, shareTo),
  );
  const withStore = includeStoreColumn(snapshot);
  const granularity = resolveRegisterReportGranularity(
    sharePeriod,
    snapshot.generalReportGranularity || snapshot.exportData?.generalReportGranularity,
  );

  return buildRegisterReportExportRows({
    entries: scoped,
    granularity,
    withStore,
    formatStore: (businessId) => storeCell(snapshot, businessId, businessesList, lang),
  });
}

function buildRegisterAttachmentsSheet(snapshot, lang, businessesList) {
  const items = snapshot.exportData?.attachmentGalleryItems || [];
  const withStore = includeStoreColumn(snapshot);
  return {
    name: text(lang, "attachments"),
    columns: [
      ...(withStore ? [{ key: "store", label: text(lang, "store"), type: "text" }] : []),
      { key: "date", label: lang === "ar" ? "التاريخ" : "Date", type: "date" },
      { key: "label", label: lang === "ar" ? "البيان" : "Label", type: "text" },
      { key: "amount", label: lang === "ar" ? "المبلغ" : "Amount", type: "number", sum: true },
      { key: "status", label: lang === "ar" ? "الحالة" : "Status", type: "text" },
    ],
    rows: items.map((item) => ({
      ...(withStore ? { store: storeCell(snapshot, item.businessId, businessesList, lang) } : {}),
      date: formatCalendarDate(item.date, lang),
      label: lang === "ar" ? item.label : item.labelEn,
      amount: -(Number(item.amount) || 0),
      status: item.voided ? text(lang, "voided") : text(lang, "active"),
    })),
  };
}

function buildRegisterExportSheets(snapshot, lang, businessesList, operationalEntries) {
  const view = snapshot.registerView || "report";
  const sheets = [];
  if (view === "operations") sheets.push(buildRegisterOperationsSheet(snapshot, lang, businessesList));
  if (view === "closeouts") sheets.push(buildRegisterCloseoutsSheet(snapshot, lang, businessesList));
  if (view === "attachments") sheets.push(buildRegisterAttachmentsSheet(snapshot, lang, businessesList));
  if (view === "report") {
    const withStore = includeStoreColumn(snapshot);
    const granularity = resolveRegisterReportGranularity(
      snapshot.period,
      snapshot.generalReportGranularity || snapshot.exportData?.generalReportGranularity,
    );
    const rows = withStore || !snapshot.exportData?.generalReportRows?.length
      ? buildRegisterReportRows(snapshot, lang, businessesList, operationalEntries).map((row) => ({
        ...(withStore ? { store: row.store } : {}),
        date: formatRegisterReportRowLabel(row.date, granularity, lang),
        sales: Number(row.sales) || 0,
        expense: Number(row.expense) || 0,
        net: Number(row.net) || 0,
      }))
      : snapshot.exportData.generalReportRows.map((row) => ({
        ...(withStore && row.store ? { store: row.store } : {}),
        date: formatRegisterReportRowLabel(row.date, granularity, lang),
        sales: Number(row.sales) || 0,
        expense: Number(row.expense) || 0,
        net: Number(row.net) || 0,
      }));
    sheets.push({
      name: registerReportGranularitySheetName(granularity, lang),
      columns: [
        ...(includeStoreColumn(snapshot) ? [{ key: "store", label: text(lang, "store"), type: "text" }] : []),
        { key: "date", label: registerReportGranularityColumnLabel(granularity, lang), type: "date" },
        { key: "sales", label: text(lang, "sales"), type: "number", sum: true },
        { key: "expense", label: text(lang, "purchasesExpenses"), type: "number", sum: true },
        { key: "net", label: text(lang, "result"), type: "number", sum: true },
      ],
      rows,
    });
  }
  return { sheets };
}

function registerViewLabel(view, lang) {
  if (view === "operations") return lang === "ar" ? "العمليات" : "Operations";
  if (view === "closeouts") return lang === "ar" ? "التقفيلات" : "Closeouts";
  if (view === "attachments") return text(lang, "attachments");
  return lang === "ar" ? "تقرير عام" : "General report";
}

/**
 * @param {object} input
 */
export function buildDataExportModel({
  snapshot,
  lang,
  businessesList,
  operationalEntries = [],
  archivedBusinessIds = [],
  apiEntries = null,
  apiRecord = null,
  apiChannelRows = null,
  apiDayRows = null,
}) {
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
    viewLabel: snapshot.screen === "register" ? registerViewLabel(snapshot.registerView, lang) : undefined,
  };

  let sheets = [];
  let shareModel = null;
  if (snapshot.screen === "register") {
    ({ sheets } = buildRegisterExportSheets(snapshot, lang, businessesList, operationalEntries));
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
          return value.toLocaleString(lang === "ar" ? "ar-SA" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    shareModel,
  };
}
