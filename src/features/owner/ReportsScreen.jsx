"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  summarizeEntries,
  summaryMonthFromEntries,
  summaryDayFromEntries,
  aggregateChannels,
  entriesInPeriod,
  entryDateMatches,
  entryIsActive,
  entryIsOutflow,
  monthSelectionValue,
} from "@/features/operations/operational-analytics";
import { text } from "@/i18n/text";
import { money, todayIsoDate, formatCalendarDate, channels, expenseCategories, outflowReportCategories, businessName, channelName, shortDate, businesses, entryCategory } from "@/utils/display-helpers";
import { Badge, NotebookRow, NumberLine, MoneyValue, InkTab } from "@/features/daily-closeouts/NotebookAtoms";
import { Notebook } from "@/features/daily-closeouts/NotebookShell";
import { DateSelector, NotebookHeading, StoreComparison } from "@/features/owner/OwnerRegisterScreen";
import { OutflowAnalysis, StoreScopeTabs } from "@/features/owner/OwnerHomeScreen";

// These components are used only in the reports context:

function RatioBadge({ value }) {
  return <span className="rounded-full bg-[#E6EFEF] px-1.5 py-0.5 text-taq-nav font-bold tabular-nums text-[#316C73]">{value}</span>;
}

function SummaryReportDetails({ lang, monthly, selectedBusiness, selectedDate, selectedMonth, reportChannels = channels, businessesList = businesses, section = "both", operationalEntries = [] }) {
  const salesBase = (monthly ? summaryMonthFromEntries(operationalEntries, selectedBusiness, selectedMonth) : summaryDayFromEntries(operationalEntries, selectedBusiness, selectedDate)).sales;
  const periodEntries = entriesInPeriod(operationalEntries, selectedBusiness, monthly ? "month" : "day", selectedDate, selectedMonth);
  const dynamicChannels = aggregateChannels(operationalEntries, selectedBusiness, monthly ? "month" : "day", selectedDate, selectedMonth, reportChannels);
  const outflowByCategory = outflowReportCategories.filter((item) => item.id !== "all").map((item) => ({ ...item, amount: periodEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && entryCategory(entry) === item.id).reduce((sum, entry) => sum + entry.amount, 0) })).filter((item) => item.amount > 0);
  const percentageOfSales = (amount) => salesBase > 0 ? `${((amount / salesBase) * 100).toFixed(1)}%` : amount > 0 ? "—" : "0.0%";
  return <>{(section === "sales" || section === "both") && dynamicChannels.map((channel) => <NotebookRow key={channel.id}><div className="flex w-full items-end justify-between ps-3 text-xs"><div className="flex items-center gap-2"><span className="font-medium text-[#716753]">{channelName(channel, lang)}</span><RatioBadge value={percentageOfSales(channel.amount)} /></div><strong className="tabular-nums font-bold text-[#112A46]"><MoneyValue value={money(channel.amount, lang)} /></strong></div></NotebookRow>)}{(section === "outflow" || section === "both") && outflowByCategory.map((item) => <NotebookRow key={item.id}><div className="flex w-full items-end justify-between ps-3 text-xs"><div className="flex items-center gap-2"><span className="font-medium text-[#716753]">{text(lang, item.label)}</span><RatioBadge value={percentageOfSales(item.amount)} /></div><strong className="tabular-nums font-bold text-[#B44747]"><MoneyValue value={money(item.amount, lang)} /></strong></div></NotebookRow>)}</>;
}

export default function ReportsScreen({ lang, operationalEntries = [], archivedReadOnlyBusinessId = null, reviewEnabledForBusiness = () => false, onShareNotebook = () => {}, notebookTheme = "yellow", selectedBusiness = "all", setSelectedBusiness = () => {}, configuredChannels = channels, reviewEnabled = false, businessesList = businesses, archivedBusinessIds = [] }) {
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
  const scopedEntries = operationalEntries.filter((entry) => isCombined ? visibleReportBusinesses.some((business) => business.id === entry.businessId) : entry.businessId === safeSelectedBusiness);
  const periodEntries = scopedEntries.filter((entry) => entryDateMatches(entry, period, selectedReportDate, selectedReportMonth, selectedReportYear, customFrom, customTo));
  const totals = summarizeEntries(periodEntries, reviewEnabledForBusiness);
  const reportDay = selectedStore ? summaryDayFromEntries(operationalEntries, selectedStore.id, selectedReportDate, reviewEnabledForBusiness) : { id: selectedReportDate };
  const reportDays = [...new Set(scopedEntries.filter((entry) => entryIsActive(entry) && entry.type === "summary" && entry.date.startsWith(monthSelectionValue(selectedReportMonth))).map((entry) => entry.date))]
    .sort()
    .reverse()
    .map((date) => ({ id: date, dayAr: formatCalendarDate(date, "ar"), dayEn: formatCalendarDate(date, "en"), ...summarizeEntries(scopedEntries.filter((entry) => entry.date === date), reviewEnabledForBusiness) }));
  const visibleChannels = aggregateChannels(operationalEntries, isCombined ? null : safeSelectedBusiness, period, selectedReportDate, selectedReportMonth, configuredChannels);
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
            <StoreComparison lang={lang} monthly={monthly} reviewEnabled={effectiveReviewEnabled} businessesList={scopedBusinesses} operationalEntries={operationalEntries} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} />
            <NotebookRow lines={2}><p className="w-full text-taq-meta font-bold text-[#806528]">{text(lang, "chooseStoreForDetails")}</p></NotebookRow>
          </div>
        ) : (
          <div>
            <NotebookRow><div className="grid w-full grid-cols-5 items-end gap-1">{tabs.map((item) => <InkTab key={item.id} active={tab === item.id} onClick={() => changeReportTab(item.id)} titleUnderline className="min-w-0 text-taq-meta">{text(lang, item.key)}</InkTab>)}</div></NotebookRow>
            {tab === "summary" && <div>
              <NotebookRow><NumberLine label={text(lang, "sales")} value={money(totals.sales, lang)} /></NotebookRow>
              {showSummaryDetails && <SummaryReportDetails lang={lang} monthly={monthly} selectedBusiness={safeSelectedBusiness} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} reportChannels={configuredChannels} businessesList={visibleReportBusinesses} section="sales" operationalEntries={operationalEntries} />}
              <NotebookRow><NumberLine label={text(lang, "purchasesExpenses")} value={money(totals.expense, lang)} valueClassName="text-[#B44747]" /></NotebookRow>
              {showSummaryDetails && <SummaryReportDetails lang={lang} monthly={monthly} selectedBusiness={safeSelectedBusiness} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} reportChannels={configuredChannels} businessesList={visibleReportBusinesses} section="outflow" operationalEntries={operationalEntries} />}
              <NotebookRow><div className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span>{text(lang, "outflowRatio")}</span><strong className="text-[#B44747]">{totals.ratio}</strong></div></NotebookRow>
              <NotebookRow strong lines={2}><div className="flex w-full items-end justify-between"><span className="text-sm font-extrabold">{monthly ? text(lang, "recordedMonthResult") : text(lang, "netMovement")}</span><strong className={`tabular-nums text-2xl font-extrabold ${totals.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(totals.net, lang)} /></strong></div></NotebookRow>
              <NotebookRow className="justify-center"><InkTab active={showSummaryDetails} onClick={() => setShowSummaryDetails(!showSummaryDetails)} className="inline-flex items-center gap-1">{text(lang, showSummaryDetails ? "hideReportDetails" : "reportDetails")}{showSummaryDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</InkTab></NotebookRow>
            </div>}
            {tab === "days" && <div>{reportDays.length === 0 ? <NotebookRow lines={2}><p className="text-xs font-bold text-[#806528]">{text(lang, "noCloseoutsPeriod")}</p></NotebookRow> : reportDays.map((day) => <NotebookRow key={day.id}><div className="grid w-full grid-cols-3 text-xs font-bold"><span>{shortDate(day, lang)}</span><span className="tabular-nums font-bold"><MoneyValue value={money(day.sales, lang)} /></span><span className="tabular-nums font-bold text-[#B44747]"><MoneyValue value={money(day.expense, lang)} /></span></div></NotebookRow>)}</div>}
            {tab === "channels" && <div>{visibleChannels.length === 0 ? <NotebookRow lines={2}><p className="text-xs font-bold text-[#806528]">{text(lang, "noSalesChannelsPeriod")}</p></NotebookRow> : visibleChannels.map((channel) => <NotebookRow key={channel.id}><div className="flex w-full items-end justify-between text-sm"><span className="font-bold">{channelName(channel, lang)}</span><strong className="tabular-nums font-bold"><MoneyValue value={money(channel.amount, lang)} /></strong></div></NotebookRow>)}</div>}
            {tab === "expenses" && <OutflowAnalysis lang={lang} period={period} selectedBusiness={safeSelectedBusiness} selectedDay={selectedReportDay} selectedDate={selectedReportDate} selectedMonth={selectedReportMonth} selectedYear={selectedReportYear} customFrom={customFrom} customTo={customTo} businessesList={visibleReportBusinesses} operationalEntries={operationalEntries.filter((entry) => safeSelectedBusiness !== "all" || activeReportBusinesses.some((business) => business.id === entry.businessId))} category={outflowCategory} setCategory={(value) => { setOutflowCategory(value); setShowOutflowTransactions(false); }} showTransactions={showOutflowTransactions} setShowTransactions={setShowOutflowTransactions} />}
            {tab === "proofs" && <div><NotebookRow><NumberLine label={text(lang, "totalAttachments")} value={`${totals.proofs}`} /></NotebookRow>{effectiveReviewEnabled ? <NotebookRow><NumberLine label={text(lang, "notReviewedItems")} value={`${totals.pending}`} valueClassName="text-[#B96725]" /></NotebookRow> : <NotebookRow lines={2}><p className="text-taq-meta font-bold text-[#806528]">{text(lang, "reviewDisabled")}</p></NotebookRow>}</div>}
          </div>
        )}
      </Notebook>
      <p className="mt-4 text-center text-taq-meta font-bold text-[#8B8274]">{text(lang, "operationalOnly")}</p>
    </motion.section>
  );
}
