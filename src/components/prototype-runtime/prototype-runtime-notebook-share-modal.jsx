"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  Send,
  X,
} from "lucide-react";
import { notebookThemes } from "@/features/daily-closeouts/notebook-themes";
import { shareImageThroughWhatsApp } from "@/features/daily-closeouts/notebook-image-sharing";
import { useNotebookExportShareData } from "@/features/phase9/client/use-notebook-export-share-data";
import {
  aggregateChannels,
  entryDateMatches,
  newestEntries,
  summarizeEntries,
  summaryMonthFromEntries,
} from "@/features/operations/operational-analytics";
import { formatCalendarDate, formatSelectedMonth } from "@/features/reports/client/report-period-labels";
import {
  channels,
  businesses,
  businessName,
  channelName,
  expenseCategories,
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
import { MoneyValue, FinancialRows, todayIsoDate } from "./prototype-runtime-notebook";
import { Logo } from "./prototype-runtime-chrome";
import { RatioBadge } from "./OwnerReportsSection";

function downloadBlobFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function captureNotebookPreviewBlob(element, backgroundColor = "#FFFDF7") {
  const { captureNotebookShareBlob } = await import("@/features/daily-closeouts/notebook-share-capture");
  return captureNotebookShareBlob(element, backgroundColor);
}

async function shareNotebookImageToWhatsApp(file, caption, lang) {
  return shareImageThroughWhatsApp({
    file,
    caption,
    lang,
    pasteHint: text(lang, "shareImagePasteHint"),
  });
}

export function NotebookShareModal({ lang, snapshot, onClose, businessesList = businesses, operationalEntries = [], archivedBusinessIds = [], notebookExportApiEnabled = false, notebookExportAuth = {} }) {
  const [format, setFormat] = useState("image");
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [shareHint, setShareHint] = useState("");
  const previewRef = useRef(null);
  const cachedImageFileRef = useRef(null);
  const preCaptureTokenRef = useRef(0);
  const {
    apiEntries,
    apiRecord,
    apiChannelRows,
    apiDayRows,
    apiPendingProofs,
  } = useNotebookExportShareData({
    enabled: notebookExportApiEnabled,
    auth: notebookExportAuth,
    snapshot,
  });
  useEffect(() => { if (snapshot) { setFormat("image"); setImageError(""); setShareHint(""); cachedImageFileRef.current = null; } }, [snapshot]);
  useEffect(() => {
    if (!snapshot || format !== "image") {
      cachedImageFileRef.current = null;
      return undefined;
    }
    const captureToken = ++preCaptureTokenRef.current;
    let cancelled = false;
    const paperColor = (notebookThemes[snapshot.theme] || notebookThemes.yellow).paper || "#FFFDF7";
    const filename = `${lang === "ar" ? "تقفيلة" : "Taqfeelah"}-${snapshot.screen}-${snapshot.selectedDate || todayIsoDate()}.png`;
    let timeoutId = 0;
    const frameId = requestAnimationFrame(() => {
      timeoutId = window.setTimeout(async () => {
        if (cancelled || captureToken !== preCaptureTokenRef.current || !previewRef.current) return;
        try {
          const blob = await captureNotebookPreviewBlob(previewRef.current, paperColor);
          if (!cancelled && captureToken === preCaptureTokenRef.current) {
            cachedImageFileRef.current = new File([blob], filename, { type: "image/png" });
          }
        } catch {
          if (!cancelled && captureToken === preCaptureTokenRef.current) cachedImageFileRef.current = null;
        }
      }, 400);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [snapshot, format, lang]);
  if (!snapshot) return null;

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
  const sharePendingProofs = typeof apiPendingProofs === "number" ? apiPendingProofs : shareProofEntries.filter((entry) => !entry.reviewed).length;
  const shareBusinessRows = includedBusinessIds.map((businessId) => { const item = businessesList.find((business) => business.id === businessId); return { business: item, ...summarizeEntries(scopedShareEntries.filter((entry) => entry.businessId === businessId)) }; }).filter((row) => row.business);
  const outflowTotal = filteredOutflowEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const outflowAverage = filteredOutflowEntries.length ? outflowTotal / filteredOutflowEntries.length : 0;
  const normalRecord = combined
    ? summarizeEntries(scopedShareEntries)
    : apiRecord
      ? apiRecord
      : monthly
        ? summaryMonthFromEntries(operationalEntries, business.id, snapshot.selectedMonth)
        : selectedDayItem;
  const record = isOutflowReport ? { sales: 0, expense: outflowTotal, net: -outflowTotal, ratio: "â€”" } : normalRecord;
  const ratio = record.ratio || (record.sales > 0 ? `${((record.expense / record.sales) * 100).toFixed(1)}%` : record.expense > 0 ? "â€”" : "0.0%");
  const title = combined ? text(lang, snapshot.screen === "reports" ? "combinedReport" : "combinedCloseout") : businessName(business, lang);
  const periodLabel = sharePeriod === "year" ? shareYear : sharePeriod === "custom" ? `${formatCalendarDate(shareFrom, lang)} â€” ${formatCalendarDate(shareTo, lang)}` : monthly ? selectedMonthItem : fullDate(selectedDayItem, lang);
  const outflowCategoryLabel = outflowCategory === "all" ? text(lang, "allCategories") : text(lang, outflowReportCategories.find((item) => item.id === outflowCategory)?.label || "other");
  const activeTheme = notebookThemes[snapshot.theme] || notebookThemes.yellow;
  const lines = {
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 43px, ${activeTheme.line} 43px, ${activeTheme.line} 44px)`,
  };
  const shareCaption = combined
    ? [
        lang === "ar" ? "تقفيلة - مقارنة المحلات" : "Taqfeelah - Shops comparison",
        periodLabel,
        ...shareBusinessRows.map((row) => lang === "ar"
          ? `${businessName(row.business, lang)} | المبيعات: ${money(row.sales, lang)} | الخارج: ${money(row.expense, lang)} | النتيجة: ${money(row.net, lang)}`
          : `${businessName(row.business, lang)} | Sales: ${money(row.sales, lang)} | Outflow: ${money(row.expense, lang)} | Result: ${money(row.net, lang)}`),
        lang === "ar"
          ? `الإجمالي | المبيعات: ${money(record.sales, lang)} | الخارج: ${money(record.expense, lang)} | النتيجة: ${money(record.net, lang)}`
          : `Total | Sales: ${money(record.sales, lang)} | Outflow: ${money(record.expense, lang)} | Result: ${money(record.net, lang)}`,
      ].join(String.fromCharCode(10))
    : isOutflowReport
      ? [
          lang === "ar" ? "تقفيلة - تقرير الخارج" : "Taqfeelah - Outflow report",
          title,
          periodLabel,
          lang === "ar" ? `التصنيف: ${outflowCategoryLabel}` : `Category: ${outflowCategoryLabel}`,
          lang === "ar" ? `إجمالي الخارج: ${money(outflowTotal, lang)}` : `Total outflow: ${money(outflowTotal, lang)}`,
          lang === "ar" ? `عدد العمليات: ${filteredOutflowEntries.length}` : `Transactions: ${filteredOutflowEntries.length}`,
        ].join(String.fromCharCode(10))
      : isChannelsReport
        ? [
            lang === "ar" ? "تقفيلة - تقرير القنوات" : "Taqfeelah - Channels report",
            title,
            periodLabel,
            ...shareChannelRows.map((row) => `${row.label}: ${money(row.amount, lang)}`),
          ].join(String.fromCharCode(10))
        : isDaysReport
          ? [
              lang === "ar" ? "تقفيلة - تقرير الأيام" : "Taqfeelah - Days report",
              title,
              periodLabel,
              ...shareDayRows.map((row) => lang === "ar"
                ? `${formatCalendarDate(row.date, lang)} | المبيعات: ${money(row.sales, lang)} | الخارج: ${money(row.expense, lang)}`
                : `${formatCalendarDate(row.date, lang)} | Sales: ${money(row.sales, lang)} | Outflow: ${money(row.expense, lang)}`),
            ].join(String.fromCharCode(10))
          : isProofsReport
            ? [
                lang === "ar" ? "تقفيلة - تقرير المرفقات" : "Taqfeelah - Attachments report",
                title,
                periodLabel,
                lang === "ar" ? `إجمالي المرفقات: ${shareProofEntries.length}` : `Total attachments: ${shareProofEntries.length}`,
                lang === "ar" ? `لم تتم مراجعتها: ${sharePendingProofs}` : `Not reviewed: ${sharePendingProofs}`,
              ].join(String.fromCharCode(10))
            : [
                lang === "ar" ? `تقفيلة - ${title}` : `Taqfeelah - ${title}`,
                periodLabel,
                lang === "ar" ? `المبيعات: ${money(record.sales, lang)}` : `Sales: ${money(record.sales, lang)}`,
                lang === "ar" ? `الخارج: ${money(record.expense, lang)}` : `Outflow: ${money(record.expense, lang)}`,
                lang === "ar" ? `النتيجة: ${money(record.net, lang)}` : `Result: ${money(record.net, lang)}`,
              ].join(String.fromCharCode(10));
  const formats = [
    { id: "image", label: "imageFormat", icon: FileImage },
    { id: "pdf", label: "pdfFormat", icon: FileText },
    { id: "excel", label: "excelFormat", icon: FileSpreadsheet },
  ];

  const detailedSummary = snapshot.screen === "reports" && snapshot.tab === "summary" && snapshot.showSummaryDetails && !combined;
  const showHomeOperations = snapshot.screen === "home" && snapshot.showDetails && !combined && !monthly;
  const shareOperations = showHomeOperations ? newestEntries(scopedShareEntries.filter(entryIsActive)) : [];
  const showOutflowOperations = isOutflowReport && snapshot.showOutflowTransactions && !combined;
  const shareOutflowOperations = showOutflowOperations ? newestEntries(filteredOutflowEntries) : [];
  const shareChannels = snapshot.reportChannels || channels;
  const salesBase = record.sales || 0;
  const percentageOfSales = (amount) => salesBase > 0 ? `${((amount / salesBase) * 100).toFixed(1)}%` : amount > 0 ? "â€”" : "0.0%";
  const shareEntries = scopedShareEntries;
  const detailOutflow = outflowReportCategories.filter((item) => item.id !== "all").map((item) => ({ ...item, amount: shareEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && entryCategory(entry) === item.id).reduce((sum, entry) => sum + entry.amount, 0) })).filter((item) => item.amount > 0);
  const salesDetailRows = aggregateChannels(operationalEntries, snapshot.selectedBusiness, monthly ? "month" : "day", shareDate, snapshot.selectedMonth, shareChannels).map((channel) => {
    const amount = channel.amount;
    return {
      label: channelName(channel, lang),
      ratio: percentageOfSales(amount),
      value: money(amount, lang),
      tone: "text-[#112A46]",
    };
  });
  const outflowDetailRows = detailOutflow.map((item) => ({
    label: text(lang, item.label),
    ratio: percentageOfSales(item.amount),
    value: money(item.amount, lang),
    tone: "text-[#B44747]",
  }));
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
            ? { headers: [text(lang, "reportType"), valueHeader], rows: [[text(lang, "totalAttachments"), String(shareProofEntries.length)], ...(snapshot.reviewEnabled !== false ? [[text(lang, "notReviewedItems"), String(sharePendingProofs)]] : [])] }
            : detailedSummary
              ? { headers: [text(lang, "reportType"), lang === "ar" ? "النسبة" : "Ratio", valueHeader], rows: tableRows.map((row) => [row.label, row.ratio || "", row.value]) }
              : { headers: [text(lang, "reportType"), valueHeader, detailsHeader], rows: tableRows.map((row) => [row.label, row.value, ""]) };
  if (showHomeOperations) {
    exportTable.rows.push([text(lang, "operations"), "", formatCalendarDate(shareDate, lang)]);
    shareOperations.forEach((item) => exportTable.rows.push([operationDisplayLabel(item, lang), money(signedEntryAmount(item), lang), `${opTime(item, lang)} آ· ${entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}`]));
  }
  if (showOutflowOperations) {
    exportTable.rows.push([text(lang, "operations"), "", periodLabel]);
    shareOutflowOperations.forEach((item) => exportTable.rows.push([operationDisplayLabel(item, lang), money(signedEntryAmount(item), lang), `${formatCalendarDate(item.date, lang)} آ· ${opTime(item, lang)} آ· ${entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}`]));
  }
  const safeExportName = `${lang === "ar" ? "تقفيلة" : "Taqfeelah"}-${snapshot.screen}-${shareDate}`;
  const imageFilename = `${safeExportName}.png`;
  const buildNotebookImageFile = async () => {
    const blob = await captureNotebookPreviewBlob(previewRef.current, activeTheme.paper || "#FFFDF7");
    return new File([blob], imageFilename, { type: "image/png" });
  };
  const resolveNotebookImageFile = async () => {
    if (cachedImageFileRef.current) return cachedImageFileRef.current;
    const file = await buildNotebookImageFile();
    cachedImageFileRef.current = file;
    return file;
  };
  const runImageAction = async (action) => {
    setImageError("");
    setShareHint("");
    setImageBusy(true);
    try {
      const file = await resolveNotebookImageFile();
      await action(file);
    } catch (error) {
      if (error?.name === "AbortError") return;
      setImageError(text(lang, "shareImageFailed"));
    } finally {
      setImageBusy(false);
    }
  };
  const downloadNotebookImage = () => runImageAction(async (file) => downloadBlobFile(file, imageFilename));
  const shareImageViaWhatsApp = () => {
    setImageError("");
    setShareHint("");
    setImageBusy(true);
    void (async () => {
      try {
        const file = await resolveNotebookImageFile();
        const result = await shareNotebookImageToWhatsApp(file, shareCaption, lang);
        if (result.method === "clipboard") setShareHint(text(lang, "shareImagePasteHint"));
        else if (result.method === "text-only") setShareHint(text(lang, "shareImageWhatsAppUnavailable"));
      } catch (error) {
        if (error?.name === "AbortError") return;
        setImageError(text(lang, "shareImageFailed"));
      } finally {
        setImageBusy(false);
      }
    })();
  };
  const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const exportExcel = () => {
    const rows = [exportTable.headers, ...exportTable.rows];
    const csvRows = rows.map((row) => row.map(csvCell).join(","));
    const csv = "ï»؟" + csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeExportName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const exportPdf = () => {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) return;
    const direction = lang === "ar" ? "rtl" : "ltr";
    const headerHtml = exportTable.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
    const rowsHtml = exportTable.rows.map((row) => `<tr>${exportTable.headers.map((_, index) => `<td>${escapeHtml(row[index] || "")}</td>`).join("")}</tr>`).join("");
    printWindow.document.write(`<!doctype html><html dir="${direction}"><head><meta charset="UTF-8"><title>${escapeHtml(safeExportName)}</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#112A46;padding:42px;background:#fff}header{border-bottom:3px solid #C28A30;padding-bottom:18px;margin-bottom:24px}h1{font-size:26px;margin:0 0 10px;font-weight:800}p{margin:4px 0;color:#716753;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}th{background:#112A46;color:#fff;text-align:${lang === "ar" ? "right" : "left"};padding:12px}td{padding:12px;border-bottom:1px solid #E6DFD1;font-weight:600}tr:last-child td{font-weight:800;border-top:2px solid #C28A30}footer{margin-top:30px;color:#827762;font-size:11px}@media print{body{padding:20px}}</style></head><body><header><h1>${escapeHtml(exportTitle)}</h1><p>${escapeHtml(periodLabel)}</p>${!combined ? `<p>${escapeHtml(title)}</p>` : ""}</header><table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table><footer>${escapeHtml(text(lang, "operationalOnly"))}</footer><script>window.onload = () => { window.print(); };<\/script></body></html>`);
    printWindow.document.close();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex flex-col justify-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-stretch lg:justify-end lg:p-0">
      <div className="max-h-[92%] overflow-y-auto rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:w-full sm:max-w-[700px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-taq-meta font-bold text-[#827762]">{text(lang, "shareOptions")}</p>
            <h3 className="text-base font-black">{format === "image" ? text(lang, "notebookImagePreview") : text(lang, "professionalReportPreview")}</h3>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {formats.map((item) => {
            const Icon = item.icon;
            const active = format === item.id;
            return (
              <button type="button" key={item.id} onClick={() => setFormat(item.id)} className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-taq-meta font-black transition ${active ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.045]"}`}>
                <Icon className="h-5 w-5" />{text(lang, item.label)}
              </button>
            );
          })}
        </div>
        {format === "image" ? (
          <>
            <div ref={previewRef} className="mb-4 overflow-hidden rounded-[24px] p-0 shadow-lg" style={{ backgroundColor: activeTheme.paper }}>
              <div className="relative px-5 pb-4 pt-3" style={{ ...lines, fontFamily: lang === "ar" ? "'Noto Sans Arabic', sans-serif" : "'Noto Sans', sans-serif" }}>
                <div className={`absolute bottom-0 top-0 w-[1.25px] ${lang === "ar" ? "right-8" : "left-8"}`} style={{ backgroundColor: activeTheme.margin }} />
                <div className={lang === "ar" ? "pr-6 pl-1" : "pl-6 pr-1"}>
                  <div className="flex h-[54px] items-center justify-center">
                    <Logo compact centered />
                  </div>
                  <div className="flex h-[44px] items-end justify-center gap-3 pb-[8px] text-taq-meta font-black text-[#112A46]">
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    <span>{periodLabel}</span>
                    <CalendarDays className="h-4 w-4 shrink-0" />
                  </div>
                  <div className="flex h-[58px] items-end justify-center pb-[8px]">
                    <div className="inline-flex flex-col items-center">
                      <p className="whitespace-nowrap text-taq-body font-black leading-none text-[#112A46]">{snapshot.screen === "reports" ? text(lang, "reportNotebook") : monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary")}</p>
                      <span className="mt-2 block h-[2px] w-full rounded-full bg-[#C28A30]" />
                    </div>
                  </div>
                  {combined ? <>
                    <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "shopsComparisonReport")}</div>
                    <div className="grid h-[44px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 pb-2 text-taq-nav font-bold text-[#806528]"><span>{text(lang, "store")}</span><span className="text-center">{text(lang, "salesShort")}</span><span className="text-center">{text(lang, "outflowShort")}</span><span className="text-center">{text(lang, "result")}</span></div>
                    {shareBusinessRows.map((row) => <div key={row.business.id} className="grid h-[44px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 pb-2 text-taq-meta"><span className="truncate font-bold">{businessName(row.business, lang, true) || businessName(row.business, lang)}</span><strong className="text-center tabular-nums">{money(row.sales, lang)}</strong><strong className="text-center tabular-nums text-[#B44747]">{money(row.expense, lang)}</strong><strong className={`text-center tabular-nums ${row.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>{money(row.net, lang)}</strong></div>)}
                    <div className="mt-1 grid h-[55px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 border-t-2 border-[#112A46]/55 pb-2 text-taq-meta"><span className="font-bold">{text(lang, "combinedTotal")}</span><strong className="text-center tabular-nums">{money(record.sales, lang)}</strong><strong className="text-center tabular-nums text-[#B44747]">{money(record.expense, lang)}</strong><strong className={`text-center tabular-nums ${record.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>{money(record.net, lang)}</strong></div>
                  </> : isOutflowReport ? <>
                    <div className="flex min-h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "detailedOutflowReport")} آ· {outflowCategoryLabel}</div>
                    <FinancialRows lang={lang} rows={[
                      { id: "share-total", label: text(lang, "totalOutflow"), value: money(outflowTotal, lang), valueClassName: "text-[#B44747]" },
                      { id: "share-count", label: text(lang, "numberTransactions"), value: `${filteredOutflowEntries.length}` },
                      { id: "share-average", label: text(lang, "averageTransaction"), value: money(outflowAverage, lang), valueClassName: "text-[#806528]" },
                    ]} />
                    {showOutflowOperations && (
                      <div className="pt-1">
                        <div className="flex h-[44px] items-end pb-[8px]">
                          <p className="inline-flex flex-col text-taq-meta font-black text-[#112A46]">
                            <span>{text(lang, "operations")}</span>
                            <span className="mt-1.5 h-[2px] w-full rounded-full bg-[#C28A30]" />
                          </p>
                        </div>
                        {shareOutflowOperations.length ? shareOutflowOperations.map((item, index) => (
                          <div key={`share-outflow-operation-${item.id}`} className={`grid min-h-[44px] w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 py-2 ${index < shareOutflowOperations.length - 1 ? "border-b border-[#D9DFE3]/70" : ""}`}>
                            <strong dir="ltr" className="min-w-[68px] whitespace-nowrap text-start tabular-nums text-taq-meta font-black text-[#B44747]">
                              <MoneyValue value={money(signedEntryAmount(item), lang)} />
                            </strong>
                            <span className="min-w-0 text-end">
                              <span className="block truncate text-taq-meta font-bold text-[#112A46]">{operationDisplayLabel(item, lang)}</span>
                              <small className="mt-0.5 block truncate text-taq-nav font-bold text-[#8A816F]">{formatCalendarDate(item.date, lang)} آ· {opTime(item, lang)} آ· {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</small>
                            </span>
                          </div>
                        )) : (
                          <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "noOutflowPeriod")}</div>
                        )}
                      </div>
                    )}
                  </> : isChannelsReport ? <>
                    <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "channelsReport")}</div>
                    {shareChannelRows.length ? shareChannelRows.map((row) => <div key={row.id} className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{row.label}</span><strong className="tabular-nums">{money(row.amount, lang)}</strong></div>) : <div className="flex h-[44px] items-end pb-2 text-xs text-[#806528]">{text(lang, "noSalesChannelsPeriod")}</div>}
                  </> : isDaysReport ? <>
                    <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "daysReport")}</div>
                    {shareDayRows.length ? <><div className="grid h-[44px] grid-cols-[1.25fr_1fr_1fr] items-end gap-1 pb-2 text-taq-nav font-bold text-[#806528]"><span>{text(lang, "day")}</span><span className="text-center">{text(lang, "salesShort")}</span><span className="text-center">{text(lang, "outflowShort")}</span></div>{shareDayRows.map((row) => <div key={row.date} className="grid h-[44px] grid-cols-[1.25fr_1fr_1fr] items-end gap-1 pb-2 text-taq-meta"><span className="truncate font-bold">{formatCalendarDate(row.date, lang)}</span><strong className="text-center tabular-nums">{money(row.sales, lang)}</strong><strong className="text-center tabular-nums text-[#B44747]">{money(row.expense, lang)}</strong></div>)}</> : <div className="flex h-[44px] items-end pb-2 text-xs text-[#806528]">{text(lang, "noCloseoutsPeriod")}</div>}
                  </> : isProofsReport ? <>
                    <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "attachmentsReport")}</div>
                    <div className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{text(lang, "totalAttachments")}</span><strong className="tabular-nums">{shareProofEntries.length}</strong></div>
                    {snapshot.reviewEnabled !== false && <div className="flex h-[44px] items-end justify-between pb-2 text-sm text-[#B96725]"><span>{text(lang, "notReviewedItems")}</span><strong className="tabular-nums">{sharePendingProofs}</strong></div>}
                    {snapshot.reviewEnabled === false && <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "reviewDisabled")}</div>}
                  </> : <>
                    <div className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{text(lang, "sales")}</span><strong className="tabular-nums"><MoneyValue value={money(record.sales, lang)} /></strong></div>
                    {detailedSummary && salesDetailRows.map((row) => (
                      <div key={`image-sales-${row.label}`} className="flex h-[44px] items-end justify-between pb-2 ps-3 text-xs">
                        <div className="flex items-center gap-2"><span className="text-[#716753]">{row.label}</span><RatioBadge value={row.ratio} /></div>
                        <strong className="tabular-nums text-[#112A46]"><MoneyValue value={row.value} /></strong>
                      </div>
                    ))}
                    <div className="flex h-[44px] items-end justify-between pb-2 text-sm text-[#B44747]"><span>{text(lang, "purchasesExpenses")}</span><strong className="tabular-nums"><MoneyValue value={money(record.expense, lang)} /></strong></div>
                    {detailedSummary && outflowDetailRows.map((row) => (
                      <div key={`image-outflow-${row.label}`} className="flex h-[44px] items-end justify-between pb-2 ps-3 text-xs">
                        <div className="flex items-center gap-2"><span className="text-[#716753]">{row.label}</span><RatioBadge value={row.ratio} /></div>
                        <strong className="tabular-nums text-[#B44747]"><MoneyValue value={row.value} /></strong>
                      </div>
                    ))}
                    <div className="flex h-[44px] items-end justify-between pb-2 text-xs text-[#806528]"><span>{text(lang, "outflowRatio")}</span><strong className="text-[#B44747]">{ratio}</strong></div>
                    <div className="mt-1 flex h-[55px] items-end justify-between border-t-2 border-[#112A46]/55 pb-2"><span className="text-sm font-bold">{snapshot.screen === "home" ? (monthly ? text(lang, "recordedMonthResult") : text(lang, "netMovement")) : text(lang, "result")}</span><strong className={`tabular-nums text-xl font-extrabold ${record.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(record.net, lang)} /></strong></div>
                    {showHomeOperations && (
                      <div className="pt-1">
                        <div className="flex h-[44px] items-end pb-[8px]">
                          <p className="inline-flex flex-col text-taq-meta font-black text-[#112A46]">
                            <span>{text(lang, "operations")} {formatCalendarDate(shareDate, lang)}</span>
                            <span className="mt-1.5 h-[2px] w-full rounded-full bg-[#C28A30]" />
                          </p>
                        </div>
                        {shareOperations.length ? shareOperations.map((item, index) => {
                          const isSale = item.type === "summary";
                          return (
                            <div key={`share-operation-${item.id}`} className={`grid min-h-[44px] w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 py-2 ${index < shareOperations.length - 1 ? "border-b border-[#D9DFE3]/70" : ""}`}>
                              <strong dir="ltr" className={`min-w-[68px] whitespace-nowrap text-start tabular-nums text-taq-meta font-black ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                                <MoneyValue value={money(signedEntryAmount(item), lang)} />
                              </strong>
                              <span className="min-w-0 text-end">
                                <span className="block truncate text-taq-meta font-bold text-[#112A46]">{operationDisplayLabel(item, lang)}</span>
                                <small className="mt-0.5 block truncate text-taq-nav font-bold text-[#8A816F]">{opTime(item, lang)} آ· {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</small>
                              </span>
                            </div>
                          );
                        }) : (
                          <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "noEntriesDay")}</div>
                        )}
                      </div>
                    )}
                  </>}
                </div>
              </div>
            </div>
            <p className="mb-2 text-center text-taq-meta font-bold text-[#827762]">{text(lang, "imageReadyToShare")}</p>
            {shareHint && <p className="mb-3 rounded-xl bg-[#E6F5E9] px-3 py-2 text-center text-taq-meta font-bold text-[#257844]">{shareHint}</p>}
            {imageError && <p className="mb-3 rounded-xl bg-[#FFF1EE] px-3 py-2 text-center text-taq-meta font-bold text-[#B44747]">{imageError}</p>}
          </>
        ) : (
          <div className="mb-5 overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[0.055]">
            <div className="bg-[#112A46] p-4 text-white">
              <div className="flex items-start justify-between gap-2"><div><p className="text-taq-meta font-medium text-white/65">{text(lang, "reportFor")}</p><h4 className="mt-1 text-sm font-extrabold">{title}</h4></div><span className={`rounded-lg px-2 py-1 text-taq-meta font-black ${format === "pdf" ? "bg-[#B44747]" : "bg-[#217346]"}`}>{format === "pdf" ? "PDF" : "Excel"}</span></div>
              <div className="mt-3 flex items-center justify-between text-taq-meta font-medium text-white/70"><span>{text(lang, "selectedPeriod")}</span><span>{periodLabel}</span></div>
            </div>
            <div className="p-3">
              <div className="grid rounded-t-lg bg-[#F4F2ED] px-3 py-2 text-taq-meta font-bold text-[#716753]" style={{ gridTemplateColumns: `repeat(${exportTable.headers.length}, minmax(0, 1fr))` }}>
                {exportTable.headers.map((header, index) => <span key={`export-head-${index}`} className={index > 0 ? "text-end" : ""}>{header}</span>)}
              </div>
              {exportTable.rows.map((row, index) => (
                <div key={`export-row-${index}`} className={`grid px-3 py-3 text-taq-meta ${index < exportTable.rows.length - 1 ? "border-b border-[#ECE6DA]" : ""} ${row[0] === text(lang, "operations") ? "bg-[#FFF4D2] font-black text-[#112A46]" : "font-bold"}`} style={{ gridTemplateColumns: `repeat(${exportTable.headers.length}, minmax(0, 1fr))` }}>
                  {exportTable.headers.map((_, cellIndex) => <span key={`export-cell-${index}-${cellIndex}`} className={`${cellIndex > 0 ? "text-end tabular-nums" : "text-[#112A46]"} truncate`}>{row[cellIndex] || ""}</span>)}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[#ECE6DA] px-4 py-3 text-taq-meta font-bold text-[#827762]"><span>{text(lang, "appName")}</span><span>{text(lang, "preparedForExport")}</span></div>
          </div>
        )}
        {format === "image" ? (
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={onClose} className="rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]">{lang === "ar" ? "إغلاق" : "Close"}</button>
            <button type="button" disabled={imageBusy} onClick={downloadNotebookImage} className="flex items-center justify-center gap-1.5 rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06] disabled:opacity-60">
              <Download className="h-3.5 w-3.5" />{text(lang, "downloadNotebookImage")}
            </button>
            <button type="button" disabled={imageBusy} onClick={shareImageViaWhatsApp} className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] py-3.5 text-taq-meta font-black text-white disabled:opacity-60">
              <Send className="h-3.5 w-3.5" />{imageBusy ? (lang === "ar" ? "جاري التجهيز…" : "Preparingâ€¦") : text(lang, "shareViaWhatsApp")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[0.7fr_1.3fr] gap-3">
            <button onClick={onClose} className="rounded-2xl bg-white py-3.5 text-xs font-black text-[#112A46] ring-1 ring-black/[0.06]">{lang === "ar" ? "إغلاق" : "Close"}</button>
            {format === "pdf" && <button type="button" onClick={exportPdf} className="flex items-center justify-center gap-2 rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white"><FileText className="h-4 w-4" />{text(lang, "exportPdf")}</button>}
            {format === "excel" && <button type="button" onClick={exportExcel} className="flex items-center justify-center gap-2 rounded-2xl bg-[#217346] py-3.5 text-xs font-black text-white"><FileSpreadsheet className="h-4 w-4" />{text(lang, "exportExcel")}</button>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
