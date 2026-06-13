import { notebookThemes } from "@/features/daily-closeouts/notebook-themes";
import {
  aggregateChannels,
  entryDateMatches,
  newestEntries,
  summarizeEntries,
  summaryMonthFromEntries,
} from "@/features/operations/operational-analytics";
import { formatCalendarDate, formatSelectedMonth } from "@/features/reports/client/report-period-labels";
import { buildOwnerCloseoutShareCaption } from "@/features/owner-notebook/owner-closeout-share";
import {
  channels,
  businesses,
  businessName,
  channelName,
  money,
  fullDate,
  opTime,
  text,
  outflowReportCategories,
} from "./prototype-runtime-demo-data";
import {
  entryHasAttachment,
  entryIsActive,
  entryIsOutflow,
  entryCategory,
  operationDisplayLabel,
  signedEntryAmount,
} from "./prototype-runtime-entry-helpers";
import { summaryDayFromEntriesWithLabels } from "./prototype-runtime-demo-operational-entries";
import { todayIsoDate } from "./prototype-runtime-notebook";

export function buildNotebookShareModel({
  snapshot,
  lang,
  businessesList,
  operationalEntries,
  archivedBusinessIds,
  apiEntries,
  apiRecord,
  apiChannelRows,
  apiDayRows,
}) {
  const sharePeriod = snapshot.period || "day";
  const monthly = sharePeriod === "month";
  const isOutflowReport = snapshot.screen === "reports" && snapshot.tab === "expenses";
  const isChannelsReport = snapshot.screen === "reports" && snapshot.tab === "channels";
  const isDaysReport = snapshot.screen === "reports" && snapshot.tab === "days";
  const isProofsReport = snapshot.screen === "reports" && snapshot.tab === "proofs";
  const activeShareBusinesses = businessesList.filter((business) => !archivedBusinessIds.includes(business.id));
  const includedBusinessIds = snapshot.includedBusinessIds || activeShareBusinesses.map((business) => business.id);
  const combined = snapshot.selectedBusiness === "all";
  const business = businessesList.find((item) => item.id === snapshot.selectedBusiness) || businessesList[0] || businesses[0];
  const shareDate = snapshot.selectedDate || todayIsoDate();
  const shareYear = snapshot.selectedYear || String(new Date().getFullYear());
  const shareFrom = snapshot.customFrom || `${shareYear}-01-01`;
  const shareTo = snapshot.customTo || todayIsoDate();
  const selectedDayItem = apiRecord
    ? {
      id: shareDate,
      dayAr: formatCalendarDate(shareDate, "ar"),
      dayEn: formatCalendarDate(shareDate, "en"),
      fullAr: formatCalendarDate(shareDate, "ar"),
      fullEn: formatCalendarDate(shareDate, "en"),
      ...apiRecord,
    }
    : summaryDayFromEntriesWithLabels(operationalEntries, business.id, shareDate);
  const selectedMonthItem = formatSelectedMonth(snapshot.selectedMonth, lang);
  const scopedShareEntries = apiEntries || operationalEntries.filter((entry) => (combined ? includedBusinessIds.includes(entry.businessId) : entry.businessId === snapshot.selectedBusiness) && entryDateMatches(entry, sharePeriod, shareDate, snapshot.selectedMonth, shareYear, shareFrom, shareTo));
  const outflowCategory = snapshot.outflowCategory || "all";
  const filteredOutflowEntries = scopedShareEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && (outflowCategory === "all" || entryCategory(entry) === outflowCategory));
  const shareChannelMap = new Map();
  if (!apiChannelRows) {
    scopedShareEntries.filter((entry) => entryIsActive(entry) && entry.type === "summary").forEach((entry) => (entry.salesChannels || []).forEach((row) => { const current = shareChannelMap.get(row.channelId) || { id: row.channelId, label: row.name || row.channelId, amount: 0 }; shareChannelMap.set(row.channelId, { ...current, amount: current.amount + row.amount }); }));
  }
  const shareChannelRows = apiChannelRows || [...shareChannelMap.values()].filter((row) => row.amount > 0);
  const shareDayRows = apiDayRows || [...new Set(scopedShareEntries.filter(entryIsActive).map((entry) => entry.date))].sort().reverse().map((date) => ({ date, ...summarizeEntries(scopedShareEntries.filter((entry) => entry.date === date)) }));
  const shareProofEntries = scopedShareEntries.filter((entry) => entryIsActive(entry) && entryHasAttachment(entry));
  const snapshotBusinessRows = Array.isArray(snapshot.summaryBusinessRows) ? snapshot.summaryBusinessRows : null;
  const shareBusinessRows = combined && snapshotBusinessRows
    ? snapshotBusinessRows
      .map((row) => {
        const item = businessesList.find((store) => store.id === row.businessId);
        if (!item) return null;
        return {
          business: item,
          sales: Number(row.sales) || 0,
          expense: Number(row.expense) || 0,
          net: Number(row.net) || 0,
          ratio: row.ratio || "0.0%",
        };
      })
      .filter(Boolean)
    : includedBusinessIds
      .map((businessId) => {
        const item = businessesList.find((store) => store.id === businessId);
        return { business: item, ...summarizeEntries(scopedShareEntries.filter((entry) => entry.businessId === businessId)) };
      })
      .filter((row) => row.business);
  const outflowTotal = filteredOutflowEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const outflowAverage = filteredOutflowEntries.length ? outflowTotal / filteredOutflowEntries.length : 0;
  const snapshotRecord = snapshot.summaryRecord && typeof snapshot.summaryRecord === "object"
    ? snapshot.summaryRecord
    : null;
  const normalRecord = combined
    ? (snapshotRecord || summarizeEntries(scopedShareEntries))
    : snapshotRecord
      ? snapshotRecord
      : apiRecord
        ? apiRecord
        : monthly
          ? summaryMonthFromEntries(operationalEntries, business.id, snapshot.selectedMonth)
          : selectedDayItem;
  const record = isOutflowReport ? { sales: 0, expense: outflowTotal, net: -outflowTotal, ratio: "—" } : normalRecord;
  const ratio = record.ratio || (record.sales > 0 ? `${((record.expense / record.sales) * 100).toFixed(1)}%` : record.expense > 0 ? "—" : "0.0%");
  const title = combined ? text(lang, snapshot.screen === "reports" ? "combinedReport" : "combinedCloseout") : businessName(business, lang);
  const periodLabel = sharePeriod === "year" ? shareYear : sharePeriod === "custom" ? `${formatCalendarDate(shareFrom, lang)} — ${formatCalendarDate(shareTo, lang)}` : monthly ? selectedMonthItem : fullDate(selectedDayItem, lang);
  const outflowCategoryLabel = outflowCategory === "all" ? text(lang, "allCategories") : text(lang, outflowReportCategories.find((item) => item.id === outflowCategory)?.label || "other");
  const activeTheme = notebookThemes[snapshot.theme] || notebookThemes.yellow;
  const lines = {
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 43px, ${activeTheme.line} 43px, ${activeTheme.line} 44px)`,
  };
  const detailedSummary = !combined && (
    (snapshot.screen === "reports" && snapshot.tab === "summary" && snapshot.showSummaryDetails)
    || (snapshot.screen === "home" && snapshot.showDetails)
  );
  const shareChannels = snapshot.reportChannels || channels;
  const salesBase = record.sales || 0;
  const percentageOfSales = (amount) => salesBase > 0 ? `${((amount / salesBase) * 100).toFixed(1)}%` : amount > 0 ? "—" : "0.0%";
  const shareEntries = scopedShareEntries;
  const snapshotOutflowCategories = Array.isArray(snapshot.snapshotOutflowCategories)
    ? snapshot.snapshotOutflowCategories
    : null;
  const detailOutflow = snapshotOutflowCategories?.length
    ? snapshotOutflowCategories
      .map((item) => ({
        ...outflowReportCategories.find((category) => category.id === item.id) || { id: item.id, label: item.id },
        amount: Number(item.amount) || 0,
      }))
      .filter((item) => item.amount > 0)
    : outflowReportCategories
      .filter((item) => item.id !== "all")
      .map((item) => ({
        ...item,
        amount: shareEntries
          .filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && entryCategory(entry) === item.id)
          .reduce((sum, entry) => sum + entry.amount, 0),
      }))
      .filter((item) => item.amount > 0);
  const snapshotChannelRows = Array.isArray(snapshot.snapshotChannelRows) ? snapshot.snapshotChannelRows : null;
  const effectiveChannelRows = snapshotChannelRows?.length
    ? snapshotChannelRows
    : apiChannelRows?.length
      ? apiChannelRows
      : null;
  const salesDetailRows = detailedSummary
    ? (effectiveChannelRows
      ? effectiveChannelRows.map((row) => {
        const amount = Number(row.amount) || 0;
        return {
          label: row.label || channelName(row, lang),
          ratio: percentageOfSales(amount),
          value: money(amount, lang),
          tone: "text-[#112A46]",
        };
      })
      : aggregateChannels(
        operationalEntries,
        snapshot.selectedBusiness,
        monthly ? "month" : "day",
        shareDate,
        snapshot.selectedMonth,
        shareChannels,
      ).map((channel) => {
        const amount = channel.amount;
        return {
          label: channelName(channel, lang),
          ratio: percentageOfSales(amount),
          value: money(amount, lang),
          tone: "text-[#112A46]",
        };
      }))
    : [];
  const outflowDetailRows = detailedSummary
    ? detailOutflow.map((item) => ({
      label: text(lang, item.label),
      ratio: percentageOfSales(item.amount),
      value: money(item.amount, lang),
      tone: "text-[#B44747]",
    }))
    : [];
  const shareCaption = combined
    ? buildOwnerCloseoutShareCaption({
      lang,
      period: sharePeriod,
      periodLabel,
      combined: true,
    })
    : isOutflowReport
      ? buildOwnerCloseoutShareCaption({
        lang,
        storeName: title,
        period: sharePeriod,
        periodLabel,
        reportKind: "outflow",
      })
      : isChannelsReport
        ? buildOwnerCloseoutShareCaption({
          lang,
          storeName: title,
          period: sharePeriod,
          periodLabel,
          reportKind: "channels",
        })
        : isDaysReport
          ? buildOwnerCloseoutShareCaption({
            lang,
            storeName: title,
            period: sharePeriod,
            periodLabel,
            reportKind: "days",
          })
          : isProofsReport
            ? buildOwnerCloseoutShareCaption({
              lang,
              storeName: title,
              period: sharePeriod,
              periodLabel,
              reportKind: "proofs",
            })
            : buildOwnerCloseoutShareCaption({
              lang,
              storeName: title,
              period: sharePeriod,
              periodLabel,
            });

  const showOutflowOperations = isOutflowReport && snapshot.showOutflowTransactions && !combined;
  const shareOutflowOperations = showOutflowOperations ? newestEntries(filteredOutflowEntries) : [];
  const tableRows = [
    { label: text(lang, "sales"), value: money(record.sales, lang), tone: "text-[#112A46]", heading: true },
    ...(detailedSummary ? salesDetailRows : []),
    { label: text(lang, "purchasesExpenses"), value: money(record.expense, lang), tone: "text-[#B44747]", heading: true },
    ...(detailedSummary ? outflowDetailRows : []),
    { label: text(lang, "outflowRatio"), value: ratio, tone: "text-[#B44747]", heading: true },
    { label: text(lang, "result"), value: money(record.net, lang), tone: record.net < 0 ? "text-[#B44747]" : "text-[#257844]", heading: true },
  ];
  const exportTitle = snapshot.screen === "reports" ? text(lang, "reportNotebook") : monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary");
  const valueHeader = lang === "ar" ? "القيمة" : "Value";
  const detailsHeader = lang === "ar" ? "التفاصيل" : "Details";
  const exportTable = combined
    ? {
        headers: [text(lang, "store"), text(lang, "sales"), text(lang, "purchasesExpenses"), text(lang, "result")],
        rows: [
          ...shareBusinessRows.map((row) => [businessName(row.business, lang), money(row.sales, lang), money(row.expense, lang), money(row.net, lang)]),
          [text(lang, "combinedTotal"), money(record.sales, lang), money(record.expense, lang), money(record.net, lang)],
        ],
      }
    : isOutflowReport
      ? {
          headers: [text(lang, "reportType"), valueHeader, detailsHeader],
          rows: [
            [text(lang, "totalOutflow"), money(outflowTotal, lang), ""],
            [text(lang, "numberTransactions"), String(filteredOutflowEntries.length), ""],
            [text(lang, "averageTransaction"), money(outflowAverage, lang), ""],
          ],
        }
      : isChannelsReport
        ? { headers: [text(lang, "channels"), valueHeader], rows: shareChannelRows.map((row) => [row.label, money(row.amount, lang)]) }
        : isDaysReport
          ? { headers: [text(lang, "day"), text(lang, "sales"), text(lang, "purchasesExpenses")], rows: shareDayRows.map((row) => [formatCalendarDate(row.date, lang), money(row.sales, lang), money(row.expense, lang)]) }
          : isProofsReport
            ? { headers: [text(lang, "reportType"), valueHeader], rows: [[text(lang, "totalAttachments"), String(shareProofEntries.length)]] }
            : detailedSummary
              ? { headers: [text(lang, "reportType"), lang === "ar" ? "النسبة" : "Ratio", valueHeader], rows: tableRows.map((row) => [row.label, row.ratio || "", row.value]) }
              : { headers: [text(lang, "reportType"), valueHeader, detailsHeader], rows: tableRows.map((row) => [row.label, row.value, ""]) };
  if (showOutflowOperations) {
    exportTable.rows.push([text(lang, "operations"), "", periodLabel]);
    shareOutflowOperations.forEach((item) => exportTable.rows.push([operationDisplayLabel(item, lang), money(signedEntryAmount(item), lang), `${formatCalendarDate(item.date, lang)} ${opTime(item, lang)} ${entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}`]));
  }
  const safeExportName = `${lang === "ar" ? "تقفيلة" : "Taqfeelah"}-${snapshot.screen}-${shareDate}`;
  const imageFilename = `${safeExportName}.png`;

  return {
    sharePeriod,
    monthly,
    isOutflowReport,
    isChannelsReport,
    isDaysReport,
    isProofsReport,
    combined,
    shareDate,
    record,
    ratio,
    title,
    periodLabel,
    outflowCategoryLabel,
    activeTheme,
    lines,
    shareCaption,
    detailedSummary,
    showOutflowOperations,
    shareOutflowOperations,
    filteredOutflowEntries,
    outflowTotal,
    outflowAverage,
    shareChannelRows,
    shareDayRows,
    shareProofEntries,
    shareBusinessRows,
    salesDetailRows,
    outflowDetailRows,
    exportTitle,
    exportTable,
    safeExportName,
    imageFilename,
  };
}
