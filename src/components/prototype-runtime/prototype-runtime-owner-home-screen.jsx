"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";
import {
  buildBusinessesWithEntrySummaries,
  entryTotalsHaveFinancialActivity,
  resolveOwnerPeriodSummaryPreference,
  resolveOwnerSingleStoreTotals,
  summarizeEntries,
  summaryMonthFromEntries,
} from "@/features/operations/operational-analytics";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import { businesses, businessName, channelName, channels, money, opTime, text } from "./prototype-runtime-demo-data";
import AttachmentLightbox from "../AttachmentLightbox";
import { AttachmentThumbButton } from "./prototype-runtime-attachment-ui";
import {
  entryDateMatches,
  entryHasAttachment,
  signedEntryAmount,
} from "./prototype-runtime-entry-helpers";
import { summaryDayFromEntriesWithLabels } from "./prototype-runtime-demo-operational-entries";
import {
  Notebook,
  NotebookRow,
  MoneyValue,
  NumberLine,
  DateSelector,
  StoreScopeTabs,
  StoreComparison,
  NotebookHeading,
  SummaryLoadingRow,
  todayIsoDate,
} from "./prototype-runtime-notebook";
import { InkTab } from "./prototype-runtime-shell-ui";
import { isOwnerApiSummaryPending } from "@/features/reports/client/owner-summary-loading";
import { useStoreDaySummaries } from "@/features/reports/client/use-store-day-summaries";
import { useStoreReports } from "@/features/reports/client/use-store-reports";
import { formatNetMarginOfSalesRatio } from "@/features/entries/client/register-log-display";
import { useHomeDayAttachments } from "@/features/entries/client/use-home-day-attachments";
import { useOrganizationEntitlements } from "@/features/billing/client/use-organization-entitlements";
import { SubscriptionRenewalBanner } from "@/features/billing/client/SubscriptionRenewalBanner";
import { SummaryReportDetails } from "./owner-summary-details";

export function OwnerHome({ lang, operationalEntries = [], operationalEntriesLoading = false, duplicateSalesAlerts = [], closeoutAlerts = [], onOpenCloseoutAlertInRegister = () => {}, onDismissCloseout = () => {}, onOpenDuplicateSummaryInRegister = () => {}, onAcknowledgeDuplicate = () => {}, onOpenOperation = () => {}, onShareNotebook = () => {}, notebookTheme = "yellow", selectedBusiness = "all", setSelectedBusiness = () => {}, businessesList = businesses, configuredChannels = channels, summaryApiEnabled = false, summaryApiOrganizationId = "", summaryApiActorUserId = "", summaryApiActorRole = "owner", entryAttachmentsApiEnabled = false, entryAttachmentsApiOrganizationId = "", entryAttachmentsApiActorUserId = "", entryAttachmentsApiActorRole = "owner", ownerProfile = null, onOpenSubscriptionSettings = () => {} }) {
  const [period, setPeriod] = useState("day");
  const [selectedDay, setSelectedDay] = useState(() => todayIsoDate());
  const [selectedDate, setSelectedDate] = useState(() => todayIsoDate());
  const [selectedMonth, setSelectedMonth] = useState(() => todayIsoDate().slice(0, 7));
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [homeAttachmentPreview, setHomeAttachmentPreview] = useState(null);
  const openHomeAttachmentPreview = (src, shareContext = null) => {
    setHomeAttachmentPreview({ src, shareContext });
  };
  const closeHomeAttachmentPreview = () => setHomeAttachmentPreview(null);
  const monthly = period === "month";
  const isCombined = selectedBusiness === "all";
  const currentBusiness = businessesList.find((business) => business.id === selectedBusiness) || businessesList[0] || null;
  const scopedBusinesses = isCombined ? businessesList : currentBusiness ? [currentBusiness] : [];
  const summaryApiActive = summaryApiEnabled;
  const {
    businessesWithDaySummaries,
    combinedResult: apiCombinedResult,
    getStoreResult,
    loading: summaryApiLoading,
    loaded: summaryApiLoaded,
    hasData: summaryApiHasData,
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
  });
  const {
    channelRows: apiChannelRows,
    outflowCategories: apiOutflowCategories,
    loading: summaryDetailsApiLoading,
    loaded: summaryDetailsApiLoaded,
    hasData: summaryDetailsApiHasData,
  } = useStoreReports({
    enabled: summaryApiActive && !isCombined && showReportDetails,
    organizationId: summaryApiOrganizationId,
    actorUserId: summaryApiActorUserId,
    actorRole: summaryApiActorRole,
    businesses: businessesList,
    selectedStoreId: selectedBusiness,
    period: monthly ? "month" : "day",
    selectedDate,
    selectedMonth,
    configuredChannels,
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
  const summaryLoadFailedWithoutFallback = summaryApiActive
    && summaryApiError
    && !localSummaryHasFinancialActivity
    && !summaryApiHasData;
  const awaitingScopedApiTotals = summaryApiActive
    && !preferEntrySummaries
    && !summaryLoadFailedWithoutFallback
    && (summaryApiLoading || !summaryApiLoaded)
    && (isCombined ? !summaryApiHasData : apiStoreResult == null);
  const summaryPending = isOwnerApiSummaryPending({
    apiEnabled: summaryApiActive,
    preferEntrySummaries,
    loading: summaryApiLoading,
    loaded: summaryApiLoaded,
    hasData: summaryApiHasData,
    loadFailed: summaryLoadFailedWithoutFallback,
  }) || awaitingScopedApiTotals;
  const summaryLoadErrorMessage = lang === "ar"
    ? "تعذر تحميل الملخص المالي من الخادم. لم يتم عرض أرقام بديلة حتى لا تظهر أصفار غير صحيحة."
    : "Failed to load the financial summary from the server. No fallback figures are shown to avoid incorrect zero totals.";
  const comparisonBusinesses = preferEntrySummaries ? localComparisonBusinesses : businessesWithDaySummaries;
  const result = isCombined
    ? preferEntrySummaries ? localCombinedResult : apiCombinedResult
    : monthly
      ? resolveOwnerSingleStoreTotals(localMonthResult, apiStoreResult, preferEntrySummaries)
      : resolveOwnerSingleStoreTotals(daySummary, apiStoreResult, preferEntrySummaries);
  const netMarginRatio = formatNetMarginOfSalesRatio(result.sales, result.net);
  const selectedBusinessEntries = currentBusiness ? operationalEntries.filter((entry) => entry.businessId === currentBusiness.id && entryDateMatches(entry, "day", selectedDate, selectedMonth, "2026", "2026-01-01", "2026-12-31")) : [];
  const useApiDetailRows = summaryApiActive
    && showReportDetails
    && !summaryDetailsApiLoading
    && summaryDetailsApiLoaded
    && summaryDetailsApiHasData
    && !isCombined
    && !preferEntrySummaries;
  const detailsLoading = showReportDetails && summaryApiActive && !isCombined && !preferEntrySummaries && summaryDetailsApiLoading;
  const {
    group: attachmentGroup,
    loading: attachmentsLoading,
    fetchError: attachmentsFetchError,
    itemCount: attachmentItemCount,
  } = useHomeDayAttachments({
    enabled: showAttachments && !monthly && !isCombined,
    localDayEntries: selectedBusinessEntries,
    selectedDate,
    proofsCount: Number(result.proofs) || 0,
    entriesApiEnabled: summaryApiEnabled,
    organizationId: summaryApiOrganizationId,
    actorUserId: summaryApiActorUserId,
    actorRole: summaryApiActorRole,
    storeId: currentBusiness?.id || "",
  });
  const displayedProofCount = attachmentItemCount > 0
    ? attachmentItemCount
    : (Number(result.proofs) || 0);
  const changePeriod = (nextPeriod) => {
    setPeriod(nextPeriod);
    setShowReportDetails(false);
    setShowAttachments(false);
  };
  const billingEntitlementsEnabled = summaryApiEnabled
    && Boolean(summaryApiOrganizationId)
    && Boolean(summaryApiActorUserId);
  const { entitlements: homeEntitlements } = useOrganizationEntitlements({
    enabled: billingEntitlementsEnabled,
    auth: {
      organizationId: summaryApiOrganizationId,
      actorUserId: summaryApiActorUserId,
      actorRole: summaryApiActorRole,
    },
  });
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-6 pt-1">
      {homeEntitlements ? (
        <div className="mx-2 mb-3">
          <SubscriptionRenewalBanner
            lang={lang}
            entitlements={homeEntitlements}
            ownerName={ownerProfile?.name || ""}
            onOpenSubscriptionSettings={onOpenSubscriptionSettings}
          />
        </div>
      ) : null}
      {closeoutAlerts.length > 0 && <div className="mx-2 mb-3 rounded-2xl bg-[#E6F5E9] p-3 ring-1 ring-[#39A160]/15"><div className="flex items-start gap-2"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#257844]" /><div className="min-w-0 flex-1"><p className="text-taq-meta font-black text-[#257844]">{text(lang, "closeoutInAppAlert")}</p><p className="mt-1 text-taq-meta font-bold text-[#716753]">{businessName(businessesList.find((business) => business.id === closeoutAlerts[0].businessId), lang)} · {formatCalendarDate(closeoutAlerts[0].date, lang)} · {lang === "ar" ? closeoutAlerts[0].employeeNameAr : closeoutAlerts[0].employeeNameEn}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onOpenCloseoutAlertInRegister(closeoutAlerts[0])} className="rounded-xl bg-white py-2.5 text-taq-meta font-black text-[#257844] ring-1 ring-[#39A160]/15">{text(lang, "openCloseoutInRegister")}</button><button type="button" onClick={() => onDismissCloseout(closeoutAlerts[0].id)} className="rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">{text(lang, "dismissAlert")}</button></div></div>}
      <Notebook fullPage theme={notebookTheme} lang={lang}>
        <NotebookHeading lang={lang} label={monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary")} onShare={() => onShareNotebook({
          theme: notebookTheme,
          period,
          selectedBusiness,
          includedBusinessIds: businessesList.map((business) => business.id),
          selectedDay: daySummary.id,
          selectedDate,
          selectedMonth,
          screen: "home",
          showDetails: showReportDetails && !isCombined,
          reportChannels: configuredChannels,
          summaryRecord: {
            sales: result.sales,
            expense: result.expense,
            net: result.net,
            ratio: result.ratio,
            proofs: Number(result.proofs) || 0,
          },
          summaryBusinessRows: isCombined
            ? comparisonBusinesses.map((business) => {
              const businessRecord = monthly ? business.month : business.day;
              return {
                businessId: business.id,
                sales: businessRecord?.sales ?? 0,
                expense: businessRecord?.expense ?? 0,
                net: businessRecord?.net ?? 0,
                ratio: businessRecord?.ratio ?? "0.0%",
              };
            })
            : undefined,
          snapshotChannelRows: useApiDetailRows
            ? apiChannelRows.map((row) => ({
              id: row.id,
              label: channelName(row, lang),
              amount: row.amount,
            }))
            : undefined,
          snapshotOutflowCategories: useApiDetailRows ? apiOutflowCategories : undefined,
        })} dateSelector={<DateSelector compact lang={lang} period={period} setPeriod={changePeriod} selectedDay={selectedDay} setSelectedDay={(id) => { setSelectedDay(id); setShowAttachments(false); }} selectedDate={selectedDate} setSelectedDate={(date) => { setSelectedDate(date); setShowAttachments(false); }} fullCalendar selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />} />
        <StoreScopeTabs lang={lang} businessesList={businessesList} selectedBusiness={selectedBusiness} setSelectedBusiness={(id) => { setSelectedBusiness(id); setShowReportDetails(false); setShowAttachments(false); }} />
        {isCombined ? (
          <div>
            {summaryLoadFailedWithoutFallback ? (
              <NotebookRow lines={3}><p className="w-full text-taq-meta font-bold text-[#B44747]">{summaryLoadErrorMessage}</p></NotebookRow>
            ) : summaryPending ? (
              <SummaryLoadingRow lang={lang} />
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
            ) : summaryPending ? (
              <SummaryLoadingRow lang={lang} />
            ) : (
              <>
                <NotebookRow><NumberLine lang={lang} handwritten label={text(lang, "sales")} value={money(result.sales, lang)} /></NotebookRow>
                {showReportDetails && !detailsLoading && (
                  <SummaryReportDetails
                    lang={lang}
                    monthly={monthly}
                    selectedBusiness={selectedBusiness}
                    selectedDate={selectedDate}
                    selectedMonth={selectedMonth}
                    reportChannels={configuredChannels}
                    businessesList={businessesList}
                    section="sales"
                    operationalEntries={operationalEntries}
                    apiChannelRows={useApiDetailRows ? apiChannelRows : null}
                    salesBaseOverride={result.sales}
                  />
                )}
                <NotebookRow><NumberLine lang={lang} handwritten label={text(lang, "purchasesExpenses")} value={money(result.expense, lang)} valueClassName="text-[#B44747]" /></NotebookRow>
                {showReportDetails && !detailsLoading && (
                  <SummaryReportDetails
                    lang={lang}
                    monthly={monthly}
                    selectedBusiness={selectedBusiness}
                    selectedDate={selectedDate}
                    selectedMonth={selectedMonth}
                    reportChannels={configuredChannels}
                    businessesList={businessesList}
                    section="outflow"
                    operationalEntries={operationalEntries}
                    apiOutflowCategories={useApiDetailRows ? apiOutflowCategories : null}
                    salesBaseOverride={result.sales}
                  />
                )}
                {detailsLoading && (
                  <NotebookRow lines={2}>
                    <p className="w-full text-taq-meta font-bold text-[#806528]">
                      {lang === "ar" ? "جاري تحميل تفاصيل التقرير…" : "Loading report details…"}
                    </p>
                  </NotebookRow>
                )}
                <NotebookRow strong lines={2}>
                  <div className="flex w-full items-end justify-between gap-3">
                    <span className="text-sm font-extrabold">{text(lang, "result")}</span>
                    <strong className={`inline-flex items-baseline gap-2 tabular-nums text-2xl font-extrabold ${result.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>
                      <MoneyValue value={money(result.net, lang)} />
                      {netMarginRatio !== "—" ? (
                        <span className="text-sm font-bold text-[#827762]">
                          ({netMarginRatio})
                        </span>
                      ) : null}
                    </strong>
                  </div>
                </NotebookRow>
                {!monthly && (
                  <NotebookRow>
                    <button onClick={() => setShowAttachments(!showAttachments)} className="flex w-full items-end justify-between text-xs font-bold text-[#806528]">
                      <span className="relative pb-1">
                        {text(lang, "attachments")}
                        {showAttachments && <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}
                      </span>
                      <span>{displayedProofCount}</span>
                    </button>
                  </NotebookRow>
                )}
                {!monthly && showAttachments && (
                  <DayAttachments
                    lang={lang}
                    group={attachmentGroup}
                    businessesList={businessesList}
                    loading={attachmentsLoading}
                    loadFailed={attachmentsFetchError}
                    proofsCount={Number(result.proofs) || 0}
                    onOpenOperation={onOpenOperation}
                    onPreviewAttachment={openHomeAttachmentPreview}
                    entryAttachmentsApiEnabled={entryAttachmentsApiEnabled}
                    entryAttachmentsApiOrganizationId={entryAttachmentsApiOrganizationId}
                    entryAttachmentsApiActorUserId={entryAttachmentsApiActorUserId}
                    entryAttachmentsApiActorRole={entryAttachmentsApiActorRole}
                  />
                )}
                <NotebookRow className="justify-center">
                  <InkTab
                    active={showReportDetails}
                    showActiveUnderline={false}
                    onClick={() => setShowReportDetails(!showReportDetails)}
                    className="inline-flex items-center gap-1"
                  >
                    {text(lang, showReportDetails ? "hideReportDetails" : "reportDetails")}
                    {showReportDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </InkTab>
                </NotebookRow>
              </>
            )}
          </div>
        )}
      </Notebook>
      <AttachmentLightbox
        open={Boolean(homeAttachmentPreview?.src)}
        src={homeAttachmentPreview?.src || ""}
        shareContext={homeAttachmentPreview?.shareContext || null}
        lang={lang}
        onClose={closeHomeAttachmentPreview}
      />
    </motion.section>
  );
}

function DayAttachments({
  lang,
  group,
  businessesList = businesses,
  loading = false,
  loadFailed = false,
  proofsCount = 0,
  onOpenOperation = () => {},
  onPreviewAttachment = () => {},
  entryAttachmentsApiEnabled = false,
  entryAttachmentsApiOrganizationId = "",
  entryAttachmentsApiActorUserId = "",
  entryAttachmentsApiActorRole = "owner",
}) {
  if (loading) {
    return (
      <NotebookRow>
        <p className="text-xs font-bold text-[#806528]">
          {lang === "ar" ? "جاري تحميل المرفقات…" : "Loading attachments…"}
        </p>
      </NotebookRow>
    );
  }
  if (!group?.items?.length) {
    return (
      <NotebookRow>
        <p className="text-xs font-bold text-[#806528]">
          {loadFailed && proofsCount > 0
            ? (lang === "ar" ? "تعذر تحميل المرفقات من الخادم." : "Failed to load attachments from the server.")
            : text(lang, "noAttachmentsDay")}
        </p>
      </NotebookRow>
    );
  }
  return (
    <div className="py-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {group.items.map((item) => {
          const store = businessesList.find((business) => business.id === item.businessId);
          const storeLabel = businessName(store, lang, true) || businessName(store, lang);
          const operationLabel = lang === "ar" ? item.title : item.titleEn;
          const shareContext = {
            entry: item.entry,
            storeName: storeLabel,
            operationLabel,
            entryTime: opTime(item.entry, lang),
            daySequence: item.entry?.daySequence ?? null,
            sameDayCloseoutCount: 1,
          };
          return (
          <div key={item.id} className="min-w-[78px] text-center">
            <div className="mb-1 flex h-14 justify-center">
              <AttachmentThumbButton
                attachment={item.attachment}
                onOpen={(src) => onPreviewAttachment(src, shareContext)}
                className="h-14 w-14 rounded-xl"
                attachmentApiContext={{
                  storeId: item.businessId,
                  attachmentsApiEnabled: entryAttachmentsApiEnabled,
                  organizationId: entryAttachmentsApiOrganizationId,
                  actorUserId: entryAttachmentsApiActorUserId,
                  actorRole: entryAttachmentsApiActorRole,
                }}
              />
            </div>
            <button type="button" onClick={() => onOpenOperation(item.entry)} className="w-full text-center">
              <p className="truncate text-taq-meta font-bold">{lang === "ar" ? item.title : item.titleEn}</p>
              <p className={`mt-0.5 text-taq-meta font-black ${item.entry.type === "summary" ? "text-[#257844]" : "text-[#B44747]"}`}>
                <MoneyValue value={money(signedEntryAmount(item.entry), lang)} />
              </p>
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
}

export function OwnerHomeConnected(props) {
  return <OwnerHome {...props} />;
}
