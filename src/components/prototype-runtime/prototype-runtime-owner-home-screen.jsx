"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import {
  buildBusinessesWithEntrySummaries,
  entriesInPeriod,
  entryTotalsHaveFinancialActivity,
  newestEntries,
  resolveOwnerPeriodSummaryPreference,
  resolveOwnerSingleStoreTotals,
  summarizeEntries,
  summaryMonthFromEntries,
} from "@/features/operations/operational-analytics";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import { businesses, businessName, money, text, fullDate, opTime } from "./prototype-runtime-demo-data";
import { AttachmentPreview } from "./prototype-runtime-attachment-ui";
import {
  entryDateMatches,
  entryHasAttachment,
  entryIsVoided,
  operationDisplayLabel,
  signedEntryAmount,
} from "./prototype-runtime-entry-helpers";
import { summaryDayFromEntriesWithLabels, attachmentsFromEntries } from "./prototype-runtime-demo-operational-entries";
import {
  Notebook,
  NotebookRow,
  MoneyValue,
  NumberLine,
  DateSelector,
  StoreScopeTabs,
  StoreComparison,
  NotebookHeading,
  todayIsoDate,
} from "./prototype-runtime-notebook";
import { Badge, InkTab } from "./prototype-runtime-shell-ui";
import { useStoreDaySummaries } from "@/features/reports/client/use-store-day-summaries";

export function OwnerHome({ lang, operationalEntries = [], operationalEntriesLoading = false, duplicateSalesAlerts = [], closeoutAlerts = [], onReviewCloseout = () => {}, onDismissCloseout = () => {}, onReviewDuplicate = () => {}, onAcknowledgeDuplicate = () => {}, onOpenOperation = () => {}, onShareNotebook = () => {}, notebookTheme = "yellow", selectedBusiness = "all", setSelectedBusiness = () => {}, businessesList = businesses, summaryApiEnabled = false, summaryApiOrganizationId = "", summaryApiActorUserId = "", summaryApiActorRole = "owner", summaryRefreshKey = 0 }) {
  const [period, setPeriod] = useState("day");
  const [selectedDay, setSelectedDay] = useState(() => todayIsoDate());
  const [selectedDate, setSelectedDate] = useState(() => todayIsoDate());
  const [selectedMonth, setSelectedMonth] = useState(() => todayIsoDate().slice(0, 7));
  const [expanded, setExpanded] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const monthly = period === "month";
  const isCombined = selectedBusiness === "all";
  const currentBusiness = businessesList.find((business) => business.id === selectedBusiness) || businessesList[0] || null;
  const scopedBusinesses = isCombined ? businessesList : currentBusiness ? [currentBusiness] : [];
  const summaryApiActive = summaryApiEnabled;
  const {
    businessesWithDaySummaries,
    combinedResult: apiCombinedResult,
    getStoreResult,
    error: summaryApiError,
  } = useStoreDaySummaries({
    enabled: summaryApiActive,
    period: monthly ? "month" : "day",
    organizationId: summaryApiOrganizationId,
    actorUserId: summaryApiActorUserId,
    actorRole: summaryApiActorRole,
    businesses: businessesList,
    date: selectedDate,
    month: selectedMonth,
    refreshKey: summaryRefreshKey,
  });
  const localComparisonBusinesses = buildBusinessesWithEntrySummaries({
    businesses: scopedBusinesses,
    operationalEntries,
    monthly,
    selectedDate,
    selectedMonth,
  });
  const daySummary = summaryDayFromEntriesWithLabels(operationalEntries, currentBusiness?.id, selectedDate);
  const localCombinedResult = summarizeEntries(operationalEntries.filter((entry) => businessesList.some((business) => business.id === entry.businessId) && entryDateMatches(entry, period, selectedDate, selectedMonth, "2026", "2026-01-01", "2026-12-31")));
  const apiStoreResult = currentBusiness?.id ? getStoreResult(currentBusiness.id) : null;
  const localMonthResult = summaryMonthFromEntries(operationalEntries, currentBusiness?.id, selectedMonth);
  const preferEntrySummaries = resolveOwnerPeriodSummaryPreference({
    localTotals: localCombinedResult,
    apiTotals: apiCombinedResult,
    entriesLoading: operationalEntriesLoading,
  });
  const localSummaryHasFinancialActivity = entryTotalsHaveFinancialActivity(localCombinedResult);
  const summaryLoadFailedWithoutFallback = summaryApiActive && summaryApiError && !localSummaryHasFinancialActivity;
  const summaryLoadErrorMessage = lang === "ar"
    ? "تعذر تحميل الملخص المالي من الخادم. لم يتم عرض أرقام بديلة حتى لا تظهر أصفار غير صحيحة."
    : "Failed to load the financial summary from the server. No fallback figures are shown to avoid incorrect zero totals.";
  const comparisonBusinesses = preferEntrySummaries ? localComparisonBusinesses : businessesWithDaySummaries;
  const result = isCombined
    ? preferEntrySummaries ? localCombinedResult : apiCombinedResult
    : monthly
      ? resolveOwnerSingleStoreTotals(localMonthResult, apiStoreResult, preferEntrySummaries)
      : resolveOwnerSingleStoreTotals(daySummary, apiStoreResult, preferEntrySummaries);
  const selectedBusinessEntries = currentBusiness ? entriesInPeriod(operationalEntries, currentBusiness.id, "day", selectedDate, selectedMonth) : [];
  const visibleDayOperations = newestEntries(selectedBusinessEntries);
  const attachmentGroup = attachmentsFromEntries(selectedBusinessEntries)[0] || null;
  const changePeriod = (nextPeriod) => {
    setPeriod(nextPeriod);
    setExpanded(false);
    setShowAttachments(false);
  };
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-6 pt-1">
      {closeoutAlerts.length > 0 && <div className="mx-2 mb-3 rounded-2xl bg-[#E6F5E9] p-3 ring-1 ring-[#39A160]/15"><div className="flex items-start gap-2"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#257844]" /><div className="min-w-0 flex-1"><p className="text-taq-meta font-black text-[#257844]">{text(lang, "closeoutInAppAlert")}</p><p className="mt-1 text-taq-meta font-bold text-[#716753]">{businessName(businessesList.find((business) => business.id === closeoutAlerts[0].businessId), lang)} · {formatCalendarDate(closeoutAlerts[0].date, lang)} · {lang === "ar" ? closeoutAlerts[0].employeeNameAr : closeoutAlerts[0].employeeNameEn}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "closeoutInAppHint")}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onReviewCloseout(closeoutAlerts[0])} className="rounded-xl bg-white py-2.5 text-taq-meta font-black text-[#257844] ring-1 ring-[#39A160]/15">{text(lang, "reviewCloseout")}</button><button type="button" onClick={() => onDismissCloseout(closeoutAlerts[0].id)} className="rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">{text(lang, "dismissAlert")}</button></div></div>}
      {duplicateSalesAlerts.length > 0 && <div className="mx-2 mb-3 rounded-2xl bg-[#FFF1EE] p-3 ring-1 ring-[#B44747]/10"><div className="flex items-start gap-2"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#B44747]" /><div className="min-w-0 flex-1"><p className="text-taq-meta font-black text-[#B44747]">{text(lang, "duplicateSalesOwnerAlert")}</p><p className="mt-1 text-taq-meta font-bold text-[#716753]">{businessName(businessesList.find((business) => business.id === duplicateSalesAlerts[0].businessId), lang)} · {formatCalendarDate(duplicateSalesAlerts[0].date, lang)} · {duplicateSalesAlerts[0].entries.length} {text(lang, "summary")}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "duplicateSalesOwnerHint")}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onReviewDuplicate(duplicateSalesAlerts[0])} className="rounded-xl bg-white py-2.5 text-taq-meta font-black text-[#B44747] ring-1 ring-[#B44747]/10">{text(lang, "reviewInLog")}</button><button type="button" onClick={() => onAcknowledgeDuplicate(duplicateSalesAlerts[0])} title={text(lang, "approveMultipleSalesHint")} className="rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">{text(lang, "approveMultipleSales")}</button></div></div>}
      <Notebook fullPage theme={notebookTheme} lang={lang}>
        <NotebookHeading lang={lang} label={monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary")} onShare={() => onShareNotebook({ theme: notebookTheme, period, selectedBusiness, includedBusinessIds: businessesList.map((business) => business.id), selectedDay: daySummary.id, selectedDate, selectedMonth, screen: "home", showDetails: expanded && !monthly && !isCombined })} dateSelector={<DateSelector compact lang={lang} period={period} setPeriod={changePeriod} selectedDay={selectedDay} setSelectedDay={(id) => { setSelectedDay(id); setShowAttachments(false); }} selectedDate={selectedDate} setSelectedDate={(date) => { setSelectedDate(date); setShowAttachments(false); }} fullCalendar selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />} />
        <StoreScopeTabs lang={lang} businessesList={businessesList} selectedBusiness={selectedBusiness} setSelectedBusiness={(id) => { setSelectedBusiness(id); setExpanded(false); setShowAttachments(false); }} />
        {isCombined ? (
          <div>
            {summaryLoadFailedWithoutFallback ? (
              <NotebookRow lines={3}><p className="w-full text-taq-meta font-bold text-[#B44747]">{summaryLoadErrorMessage}</p></NotebookRow>
            ) : (
              <>
                <StoreComparison lang={lang} monthly={monthly} businessesList={comparisonBusinesses} />
                <NotebookRow lines={2}><p className="w-full text-taq-meta font-bold text-[#806528]">{text(lang, "chooseStoreForDetails")}</p></NotebookRow>
              </>
            )}
          </div>
        ) : (
          <div>
            {summaryLoadFailedWithoutFallback ? (
              <NotebookRow lines={3}><p className="w-full text-taq-meta font-bold text-[#B44747]">{summaryLoadErrorMessage}</p></NotebookRow>
            ) : (
              <>
                <NotebookRow><NumberLine lang={lang} handwritten label={text(lang, "sales")} value={money(result.sales, lang)} /></NotebookRow>
                <NotebookRow><NumberLine lang={lang} handwritten label={text(lang, "purchasesExpenses")} value={money(result.expense, lang)} valueClassName="text-[#B44747]" /></NotebookRow>
                <NotebookRow><div className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span>{text(lang, "outflowRatio")}</span><strong className="text-[#B44747]">{result.ratio}</strong></div></NotebookRow>
                <NotebookRow strong lines={2}><div className="flex w-full items-end justify-between"><span className="text-sm font-extrabold">{monthly ? text(lang, "recordedMonthResult") : text(lang, "netMovement")}</span><strong className={`tabular-nums text-2xl font-extrabold ${result.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(result.net, lang)} /></strong></div></NotebookRow>
                <NotebookRow>{monthly ? <div className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span>{text(lang, "attachments")}</span><span>{result.proofs}</span></div> : <button onClick={() => setShowAttachments(!showAttachments)} className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span className="relative pb-1">{text(lang, "attachments")}{showAttachments && <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span><span>{result.proofs}</span></button>}</NotebookRow>
                {!monthly && showAttachments && <DayAttachments lang={lang} group={attachmentGroup} onOpenOperation={onOpenOperation} />}
                <NotebookRow className="justify-center"><InkTab active={expanded} showActiveUnderline={false} onClick={() => setExpanded(!expanded)} className="inline-flex items-center gap-1">{expanded ? text(lang, "hideDetails") : text(lang, "showMore")}{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</InkTab></NotebookRow>
              </>
            )}
          </div>
        )}
      </Notebook>
      {!isCombined && expanded && !monthly && (
        <div className={`mt-1 pb-3 ${lang === "ar" ? "pr-11 pl-6" : "pl-11 pr-6"}`}>
          <div className="flex h-[44px] items-end pb-[8px]">
            <h3 className="text-taq-body-sm font-black text-[#112A46]">
              {text(lang, "operations")} {fullDate(daySummary, lang)}
            </h3>
          </div>
          {visibleDayOperations.length ? (
            <div>
              {visibleDayOperations.map((item) => {
                const isSale = item.type === "summary";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenOperation(item)}
                    className="grid w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-4 py-3 text-start transition hover:bg-[#FFF4D2]/30"
                  >
                    <strong dir="ltr" className={`min-w-[74px] whitespace-nowrap text-start tabular-nums text-taq-body-sm font-black ${entryIsVoided(item) ? "text-[#A99D87] line-through" : isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                      <MoneyValue value={money(signedEntryAmount(item), lang)} />
                    </strong>
                    <span className="min-w-0 text-end">
                      <span className="flex items-center justify-end gap-2 text-taq-body-sm font-bold text-[#112A46]">
                        {operationDisplayLabel(item, lang)}
                        {entryIsVoided(item) && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                      </span>
                      <small className="mt-1 block truncate text-taq-meta font-bold text-[#8A816F]">
                        {opTime(item, lang)} · {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="flex h-[44px] items-end pb-[8px] text-xs font-bold text-[#827762]">{text(lang, "noEntriesDay")}</p>
          )}
        </div>
      )}
    </motion.section>
  );
}

function DayAttachments({ lang, group, onOpenOperation = () => {} }) {
  if (!group?.items?.length) {
    return (
      <NotebookRow>
        <p className="text-xs font-bold text-[#806528]">{text(lang, "noAttachmentsDay")}</p>
      </NotebookRow>
    );
  }
  return (
    <div className="py-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {group.items.map((item) => (
          <button key={item.id} onClick={() => onOpenOperation(item.entry)} className="min-w-[78px] text-center">
            <div className="mb-1 flex h-14 justify-center overflow-hidden rounded-xl">
              <AttachmentPreview attachment={item.attachment} className="h-14 w-14 rounded-xl" />
            </div>
            <p className="truncate text-taq-meta font-bold">{lang === "ar" ? item.title : item.titleEn}</p>
            <p className={`mt-0.5 text-taq-meta font-black ${item.entry.type === "summary" ? "text-[#257844]" : "text-[#B44747]"}`}>
              <MoneyValue value={money(signedEntryAmount(item.entry), lang)} />
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function OwnerHomeConnected(props) {
  return <OwnerHome {...props} />;
}
