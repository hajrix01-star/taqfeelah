"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useStoreReports } from "@/features/reports/client/use-store-reports";
import {
  aggregateChannels,
  buildBusinessesWithEntrySummaries,
  entriesInPeriod,
  entryTotalsHaveFinancialActivity,
  newestEntries,
  resolveOwnerPeriodSummaryPreference,
  resolveOwnerSingleStoreTotals,
  summarizeEntries,
  summaryMonthFromEntries,
} from "@/features/operations/operational-analytics";
import {
  buildLocalReportDaysFromEntries,
  buildOutflowByCategoryFromEntries,
  computeOutflowAnalysisMetrics,
  filterOutflowEntriesForPeriod,
  percentageOfSalesAmount,
} from "@/features/reports/client/operational-reports-display";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import {
  businessName,
  businesses,
  channelName,
  channels,
  money,
  outflowReportCategories,
  shortDate,
  text,
} from "./prototype-runtime-demo-data";
import {
  entryCategory,
  entryDateMatches,
  entryHasAttachment,
} from "./prototype-runtime-entry-helpers";
import {
  Badge,
  InkTab,
} from "./prototype-runtime-shell-ui";
import {
  Notebook,
  NotebookHeading,
  NotebookRow,
  NotebookInk,
  MoneyValue,
  NumberLine,
  FinancialRows,
  DateSelector,
  StoreScopeTabs,
  StoreComparison,
  todayIsoDate,
  monthSelectionValue,
} from "./prototype-runtime-notebook";

import { summaryDayFromEntries } from "@/features/operations/operational-analytics";

function summaryDayFromEntriesWithLabels(entries, businessId, date, reviewEnabledForBusiness = () => false) {
  return summaryDayFromEntries(entries, businessId, date, reviewEnabledForBusiness, formatCalendarDate);
}

function OutflowAnalysis({ lang, period, selectedBusiness, selectedDay, selectedDate, selectedMonth, selectedYear, customFrom, customTo, businessesList = businesses, operationalEntries = [], category = "all", setCategory = () => {}, showTransactions = false, setShowTransactions = () => {}, apiTransactions = null, apiTotal = null, apiCount = null }) {
  const useApiTransactions = Array.isArray(apiTransactions);
  const localRecords = filterOutflowEntriesForPeriod({
    entries: operationalEntries,
    selectedBusiness,
    category,
    period,
    selectedDate,
    selectedMonth,
    selectedYear,
    customFrom,
    customTo,
    resolveCategory: entryCategory,
  });
  const { visibleRecords, total, count, average } = computeOutflowAnalysisMetrics(
    useApiTransactions ? apiTransactions : localRecords,
    apiTotal,
    apiCount,
  );
  const selectedCategoryLabel = category === "all" ? text(lang, "allCategories") : text(lang, outflowReportCategories.find((item) => item.id === category)?.label || "other");
  const totalLabel = category === "all" ? text(lang, "totalOutflow") : `${text(lang, "totalOutflow")} آ· ${selectedCategoryLabel}`;
  return <div><div className="flex min-h-[88px] flex-wrap content-center items-end gap-x-4 gap-y-3 pb-3 pt-2">{outflowReportCategories.map((item) => { const active = category === item.id; return <button key={item.id} onClick={() => setCategory(item.id)} className={`relative pb-1.5 text-taq-meta font-bold transition ${active ? "text-[#B44747]" : "text-[#806528]"}`}><span className="relative inline-flex whitespace-nowrap">{text(lang, item.label)}{active && <span className="absolute -bottom-[7px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span></button>; })}</div><FinancialRows lang={lang} rows={[
    { id: "total", label: totalLabel, value: money(total, lang), valueClassName: "text-[#B44747]" },
    { id: "count", label: text(lang, "numberTransactions"), value: `${count}` },
    { id: "average", label: text(lang, "averageTransaction"), value: money(average, lang), valueClassName: "text-[#806528]" },
  ]} /><NotebookRow className="justify-center"><InkTab active={showTransactions} onClick={() => setShowTransactions(!showTransactions)}>{text(lang, showTransactions ? "hideTransactions" : "viewTransactions")}</InkTab></NotebookRow>{showTransactions && (visibleRecords.length ? <div>{newestEntries(visibleRecords).map((record) => { const store = businessesList.find((business) => business.id === record.businessId); return <NotebookRow key={record.id} lines={2}><div className="w-full"><div className="mb-1 flex items-end justify-between text-xs"><strong className="font-medium text-[#112A46]">{text(lang, outflowReportCategories.find((item) => item.id === entryCategory(record))?.label || "other")}</strong><strong className="tabular-nums font-bold text-[#B44747]"><MoneyValue value={money(-record.amount, lang)} /></strong></div><div className="flex justify-between text-taq-meta font-bold text-[#806528]"><span>{formatCalendarDate(record.date, lang)} آ· {businessName(store, lang, true)}</span><span>{entryHasAttachment(record) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</span></div></div></NotebookRow>; })}</div> : <NotebookRow><p className="text-xs font-bold text-[#806528]">{text(lang, "noOutflowPeriod")}</p></NotebookRow>)}</div>;
}

function RatioBadge({ value }) {
  return <span className="rounded-full bg-[#E6EFEF] px-1.5 py-0.5 text-taq-nav font-bold tabular-nums text-[#316C73]">{value}</span>;
}

function SummaryReportDetails({ lang, monthly, selectedBusiness, selectedDate, selectedMonth, reportChannels = channels, businessesList = businesses, section = "both", operationalEntries = [], apiChannelRows = null, apiOutflowCategories = null, salesBaseOverride = null }) {
  const salesBase = typeof salesBaseOverride === "number"
    ? salesBaseOverride
    : (monthly
      ? summaryMonthFromEntries(operationalEntries, selectedBusiness, selectedMonth)
      : summaryDayFromEntriesWithLabels(operationalEntries, selectedBusiness, selectedDate)).sales;
  const periodEntries = entriesInPeriod(operationalEntries, selectedBusiness, monthly ? "month" : "day", selectedDate, selectedMonth);
  const dynamicChannels = Array.isArray(apiChannelRows)
    ? apiChannelRows
    : aggregateChannels(operationalEntries, selectedBusiness, monthly ? "month" : "day", selectedDate, selectedMonth, reportChannels);
  const outflowByCategory = Array.isArray(apiOutflowCategories)
    ? apiOutflowCategories.map((item) => ({
      ...outflowReportCategories.find((category) => category.id === item.id) || { id: item.id, label: item.id },
      amount: item.amount,
    })).filter((item) => item.amount > 0)
    : buildOutflowByCategoryFromEntries(periodEntries, outflowReportCategories, entryCategory);
  const percentageOfSales = (amount) => percentageOfSalesAmount(amount, salesBase);
  return <>{(section === "sales" || section === "both") && dynamicChannels.map((channel) => <NotebookRow key={channel.id}><div className="flex w-full items-end justify-between ps-3 text-xs"><div className="flex items-center gap-2"><span className="font-medium text-[#716753]">{channelName(channel, lang)}</span><RatioBadge value={percentageOfSales(channel.amount)} /></div><strong className="tabular-nums font-bold text-[#112A46]"><MoneyValue value={money(channel.amount, lang)} /></strong></div></NotebookRow>)}{(section === "outflow" || section === "both") && outflowByCategory.map((item) => <NotebookRow key={item.id}><div className="flex w-full items-end justify-between ps-3 text-xs"><div className="flex items-center gap-2"><span className="font-medium text-[#716753]">{text(lang, item.label)}</span><RatioBadge value={percentageOfSales(item.amount)} /></div><strong className="tabular-nums font-bold text-[#B44747]"><MoneyValue value={money(item.amount, lang)} /></strong></div></NotebookRow>)}</>;
}

function ReportsScreen({ lang, operationalEntries = [], operationalEntriesLoading = false, archivedReadOnlyBusinessId = null, reviewEnabledForBusiness = () => false, onShareNotebook = () => {}, notebookTheme = "yellow", selectedBusiness = "all", setSelectedBusiness = () => {}, configuredChannels = channels, reviewEnabled = false, businessesList = businesses, archivedBusinessIds = [], reportsApiEnabled = false, reportsApiOrganizationId = "", reportsApiActorUserId = "", reportsApiActorRole = "owner", summaryRefreshKey = 0 }) {
  const [period, setPeriod] = useState("day");
  const [selectedReportDay, setSelectedReportDay] = useState(() => todayIsoDate());
  const [selectedReportDate, setSelectedReportDate] = useState(() => todayIsoDate());
  const [selectedReportMonth, setSelectedReportMonth] = useState(() => todayIsoDate().slice(0, 7));
  const [selectedReportYear, setSelectedReportYear] = useState(() => String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [customTo, setCustomTo] = useState(() => todayIsoDate());
  const [tab, setTab] = useState("summary");
  const [outflowCategory, setOutflowCategory] = useState("all");
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);
  const [showOutflowTransactions, setShowOutflowTransactions] = useState(false);
  const archivedReadOnlyBusiness = archivedReadOnlyBusinessId && archivedBusinessIds.includes(archivedReadOnlyBusinessId)
    ? businessesList.find((business) => business.id === archivedReadOnlyBusinessId)
    : null;
  const activeReportBusinesses = businessesList.filter((business) => !archivedBusinessIds.includes(business.id));
  const visibleReportBusinesses = archivedReadOnlyBusiness ? [archivedReadOnlyBusiness] : activeReportBusinesses;
  const safeSelectedBusiness = archivedReadOnlyBusiness
    ? archivedReadOnlyBusiness.id
    : visibleReportBusinesses.length === 1
      ? visibleReportBusinesses[0].id
      : selectedBusiness === "all" || visibleReportBusinesses.some((business) => business.id === selectedBusiness)
        ? selectedBusiness
        : "all";
  const monthly = period === "month";
  const isCombined = safeSelectedBusiness === "all";
  const selectedStore = visibleReportBusinesses.find((business) => business.id === safeSelectedBusiness) || visibleReportBusinesses[0] || null;
  const scopedBusinesses = isCombined ? visibleReportBusinesses : selectedStore ? [selectedStore] : [];
  const effectiveReviewEnabled = archivedReadOnlyBusiness ? reviewEnabledForBusiness(archivedReadOnlyBusiness.id) : reviewEnabled;
  const {
    loading: reportsApiLoading,
    error: reportsApiError,
    hasData: reportsApiLoaded,
    combinedTotals: apiCombinedTotals,
    singleStoreTotals: apiSingleStoreTotals,
    businessesWithSummaries,
    daysRows: apiDaysRows,
    channelRows: apiChannelRows,
    outflowCategories: apiOutflowCategories,
    outflowTransactions: apiOutflowTransactions,
    outflowTransactionCount: apiOutflowTransactionCount,
    outflowTotal: apiOutflowTotal,
    attachmentProofs: apiAttachmentProofs,
  } = useStoreReports({
    enabled: reportsApiEnabled,
    organizationId: reportsApiOrganizationId,
    actorUserId: reportsApiActorUserId,
    actorRole: reportsApiActorRole,
    businesses: visibleReportBusinesses,
    selectedStoreId: safeSelectedBusiness,
    period,
    selectedDate: selectedReportDate,
    selectedMonth: selectedReportMonth,
    selectedYear: selectedReportYear,
    customFrom,
    customTo,
    configuredChannels,
    outflowCategory,
    includeOutflowTransactions: showOutflowTransactions,
    refreshKey: summaryRefreshKey,
  });
  const scopedEntries = operationalEntries.filter((entry) => isCombined ? visibleReportBusinesses.some((business) => business.id === entry.businessId) : entry.businessId === safeSelectedBusiness);
  const periodEntries = scopedEntries.filter((entry) => entryDateMatches(entry, period, selectedReportDate, selectedReportMonth, selectedReportYear, customFrom, customTo));
  const localTotals = summarizeEntries(periodEntries, reviewEnabledForBusiness);
  const localComparisonBusinesses = buildBusinessesWithEntrySummaries({
    businesses: scopedBusinesses,
    operationalEntries,
    monthly,
    selectedDate: selectedReportDate,
    selectedMonth: selectedReportMonth,
    reviewEnabledForBusiness,
  });
  const preferEntrySummaries = resolveOwnerPeriodSummaryPreference({
    localTotals,
    apiTotals: apiCombinedTotals,
    entriesLoading: operationalEntriesLoading,
  });
  const reportsLoadFailedWithoutFallback = reportsApiEnabled
    && reportsApiError
    && !entryTotalsHaveFinancialActivity(localTotals);
  const reportsLoadErrorMessage = lang === "ar"
    ? "تعذر تحميل التقرير المالي من الخادم. لم يتم عرض أرقام بديلة حتى لا تظهر أصفار غير صحيحة."
    : "Failed to load the financial report from the server. No fallback figures are shown to avoid incorrect zero totals.";
  const comparisonBusinesses = preferEntrySummaries ? localComparisonBusinesses : businessesWithSummaries;
  const useApiDetailTabs = reportsApiEnabled && !reportsApiLoading && reportsApiLoaded && !isCombined && !preferEntrySummaries;
  const totals = isCombined
    ? preferEntrySummaries ? localTotals : apiCombinedTotals
    : resolveOwnerSingleStoreTotals(localTotals, apiSingleStoreTotals, preferEntrySummaries);
  const reportDay = selectedStore
    ? summaryDayFromEntriesWithLabels(operationalEntries, selectedStore.id, selectedReportDate, reviewEnabledForBusiness)
    : { id: selectedReportDate };
  const localReportDays = buildLocalReportDaysFromEntries(scopedEntries, selectedReportMonth, reviewEnabledForBusiness);
  const reportDays = useApiDetailTabs
    ? apiDaysRows
      .filter((day) => day.id.startsWith(monthSelectionValue(selectedReportMonth)))
      .map((day) => ({
        ...day,
        dayAr: formatCalendarDate(day.id, "ar"),
        dayEn: formatCalendarDate(day.id, "en"),
      }))
    : localReportDays;
  const visibleChannels = useApiDetailTabs
    ? apiChannelRows
    : aggregateChannels(operationalEntries, isCombined ? null : safeSelectedBusiness, period, selectedReportDate, selectedReportMonth, configuredChannels);
  const proofsTotals = useApiDetailTabs && apiAttachmentProofs
    ? { proofs: apiAttachmentProofs.proofs, pending: apiAttachmentProofs.pending }
    : { proofs: totals.proofs, pending: totals.pending };
  const tabs = [
    { id: "summary", key: "summary" },
    { id: "days", key: "days" },
    { id: "channels", key: "channels" },
    { id: "expenses", key: "outflow" },
    { id: "proofs", key: "photos" },
  ];
  const changeReportPeriod = (nextPeriod) => {
    setPeriod(nextPeriod);
    setShowSummaryDetails(false);
    setShowOutflowTransactions(false);
  };
  const changeReportTab = (nextTab) => {
    setTab(nextTab);
    setShowSummaryDetails(false);
    setShowOutflowTransactions(false);
    if (nextTab !== "expenses" && (period === "year" || period === "custom")) setPeriod("month");
  };
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-6 pt-1">
      <Notebook fullPage theme={notebookTheme} lang={lang}>
        {archivedReadOnlyBusiness && <div className="mx-2 mb-2 flex justify-center"><Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge></div>}<NotebookHeading lang={lang} label={text(lang, "reportNotebook")} onShare={() => onShareNotebook({ theme: notebookTheme, period, selectedBusiness: safeSelectedBusiness, includedBusinessIds: activeReportBusinesses.map((business) => business.id), selectedDay: reportDay.id, selectedDate: selectedReportDate, selectedMonth: selectedReportMonth, selectedYear: selectedReportYear, customFrom, customTo, screen: "reports", tab, outflowCategory, reviewEnabled: effectiveReviewEnabled, showSummaryDetails: tab === "summary" && showSummaryDetails, showOutflowTransactions: tab === "expenses" && showOutflowTransactions, reportChannels: configuredChannels })} dateSelector={<DateSelector compact lang={lang} period={period} setPeriod={changeReportPeriod} allowedPeriods={tab === "expenses" ? ["day", "month", "year", "custom"] : ["day", "month"]} selectedDay={selectedReportDay} setSelectedDay={setSelectedReportDay} selectedDate={selectedReportDate} setSelectedDate={setSelectedReportDate} fullCalendar selectedMonth={selectedReportMonth} setSelectedMonth={setSelectedReportMonth} selectedYear={selectedReportYear} setSelectedYear={setSelectedReportYear} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} />} />
        <StoreScopeTabs lang={lang} businessesList={visibleReportBusinesses} selectedBusiness={safeSelectedBusiness} setSelectedBusiness={(id) => { if (!archivedReadOnlyBusiness) setSelectedBusiness(id); setShowSummaryDetails(false); }} />
        {isCombined ? (
          <div>
            {reportsLoadFailedWithoutFallback ? (
              <NotebookRow lines={3}><p className="w-full text-taq-meta font-bold text-[#B44747]">{reportsLoadErrorMessage}</p></NotebookRow>
            ) : (
              <>
                <StoreComparison lang={lang} monthly={monthly} reviewEnabled={effectiveReviewEnabled} businessesList={comparisonBusinesses} />
                <NotebookRow lines={2}><p className="w-full text-taq-meta font-bold text-[#806528]">{text(lang, "chooseStoreForDetails")}</p></NotebookRow>
              </>
            )}
          </div>
        ) : (
          <div>
            <NotebookRow><div className="grid w-full grid-cols-5 items-end gap-1">{tabs.map((item) => <InkTab key={item.id} active={tab === item.id} onClick={() => changeReportTab(item.id)} titleUnderline className="min-w-0 text-taq-meta">{text(lang, item.key)}</InkTab>)}</div></NotebookRow>
            {tab === "summary" && <div>
              {reportsLoadFailedWithoutFallback ? (
                <NotebookRow lines={3}><p className="w-full text-taq-meta font-bold text-[#B44747]">{reportsLoadErrorMessage}</p></NotebookRow>
              ) : (
                <>
                  <NotebookRow><NumberLine label={text(lang, "sales")} value={money(totals.sales, lang)} /></NotebookRow>
                  {showSummaryDetails && <SummaryReportDetails lang={lang} monthly={monthly} selectedBusiness={safeSelectedBusiness} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} reportChannels={configuredChannels} businessesList={visibleReportBusinesses} section="sales" operationalEntries={operationalEntries} apiChannelRows={useApiDetailTabs ? apiChannelRows : null} salesBaseOverride={totals.sales} />}
                  <NotebookRow><NumberLine label={text(lang, "purchasesExpenses")} value={money(totals.expense, lang)} valueClassName="text-[#B44747]" /></NotebookRow>
                  {showSummaryDetails && <SummaryReportDetails lang={lang} monthly={monthly} selectedBusiness={safeSelectedBusiness} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} reportChannels={configuredChannels} businessesList={visibleReportBusinesses} section="outflow" operationalEntries={operationalEntries} apiOutflowCategories={useApiDetailTabs ? apiOutflowCategories : null} salesBaseOverride={totals.sales} />}
                  <NotebookRow><div className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span>{text(lang, "outflowRatio")}</span><strong className="text-[#B44747]">{totals.ratio}</strong></div></NotebookRow>
                  <NotebookRow strong lines={2}><div className="flex w-full items-end justify-between"><span className="text-sm font-extrabold">{monthly ? text(lang, "recordedMonthResult") : text(lang, "netMovement")}</span><strong className={`tabular-nums text-2xl font-extrabold ${totals.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(totals.net, lang)} /></strong></div></NotebookRow>
                  <NotebookRow className="justify-center"><InkTab active={showSummaryDetails} onClick={() => setShowSummaryDetails(!showSummaryDetails)} className="inline-flex items-center gap-1">{text(lang, showSummaryDetails ? "hideReportDetails" : "reportDetails")}{showSummaryDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</InkTab></NotebookRow>
                </>
              )}
            </div>}
            {tab === "days" && <div>{reportsLoadFailedWithoutFallback ? <NotebookRow lines={3}><p className="w-full text-taq-meta font-bold text-[#B44747]">{reportsLoadErrorMessage}</p></NotebookRow> : reportDays.length === 0 ? <NotebookRow lines={2}><p className="text-xs font-bold text-[#806528]">{text(lang, "noCloseoutsPeriod")}</p></NotebookRow> : reportDays.map((day) => <NotebookRow key={day.id}><div className="grid w-full grid-cols-3 text-xs font-bold"><span>{shortDate(day, lang)}</span><span className="tabular-nums font-bold"><MoneyValue value={money(day.sales, lang)} /></span><span className="tabular-nums font-bold text-[#B44747]"><MoneyValue value={money(day.expense, lang)} /></span></div></NotebookRow>)}</div>}
            {tab === "channels" && <div>{reportsLoadFailedWithoutFallback ? <NotebookRow lines={3}><p className="w-full text-taq-meta font-bold text-[#B44747]">{reportsLoadErrorMessage}</p></NotebookRow> : visibleChannels.length === 0 ? <NotebookRow lines={2}><p className="text-xs font-bold text-[#806528]">{text(lang, "noSalesChannelsPeriod")}</p></NotebookRow> : visibleChannels.map((channel) => <NotebookRow key={channel.id}><div className="flex w-full items-end justify-between text-sm"><span className="font-bold">{channelName(channel, lang)}</span><strong className="tabular-nums font-bold"><MoneyValue value={money(channel.amount, lang)} /></strong></div></NotebookRow>)}</div>}
            {tab === "expenses" && (reportsLoadFailedWithoutFallback ? <NotebookRow lines={3}><p className="w-full text-taq-meta font-bold text-[#B44747]">{reportsLoadErrorMessage}</p></NotebookRow> : <OutflowAnalysis lang={lang} period={period} selectedBusiness={safeSelectedBusiness} selectedDay={selectedReportDay} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} selectedYear={selectedReportYear} customFrom={customFrom} customTo={customTo} businessesList={visibleReportBusinesses} operationalEntries={operationalEntries.filter((entry) => safeSelectedBusiness !== "all" || activeReportBusinesses.some((business) => business.id === entry.businessId))} category={outflowCategory} setCategory={(value) => { setOutflowCategory(value); setShowOutflowTransactions(false); }} showTransactions={showOutflowTransactions} setShowTransactions={setShowOutflowTransactions} apiTransactions={useApiDetailTabs ? apiOutflowTransactions : null} apiTotal={useApiDetailTabs ? apiOutflowTotal : null} apiCount={useApiDetailTabs ? apiOutflowTransactionCount : null} />)}
            {tab === "proofs" && <div>{reportsLoadFailedWithoutFallback ? <NotebookRow lines={3}><p className="w-full text-taq-meta font-bold text-[#B44747]">{reportsLoadErrorMessage}</p></NotebookRow> : <><NotebookRow><NumberLine label={text(lang, "totalAttachments")} value={`${proofsTotals.proofs}`} /></NotebookRow>{effectiveReviewEnabled ? <NotebookRow><NumberLine label={text(lang, "notReviewedItems")} value={`${proofsTotals.pending}`} valueClassName="text-[#B96725]" /></NotebookRow> : <NotebookRow lines={2}><p className="text-taq-meta font-bold text-[#806528]">{text(lang, "reviewDisabled")}</p></NotebookRow>}</>}</div>}
          </div>
        )}
      </Notebook>
      <p className="mt-4 text-center text-taq-meta font-bold text-[#8B8274]">{text(lang, "operationalOnly")}</p>
    </motion.section>
  );
}

export { ReportsScreen, OutflowAnalysis, SummaryReportDetails, RatioBadge };
