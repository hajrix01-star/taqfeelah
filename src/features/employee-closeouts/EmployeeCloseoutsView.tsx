"use client";

import NotebookScrollSurface from "../daily-closeouts/NotebookScrollSurface";
import DailyCloseoutEntryFlow from "./DailyCloseoutEntryFlow";
import CloseoutShareModal from "./CloseoutShareModal";
import { resolveCloseoutStoreName } from "./store-name-resolver";
import { EmployeeCloseoutsListPanel } from "./employee-closeouts-list-panel";
import { resolveEmployeeDisplayName } from "./employee-portal-session";
import { useEmployeeCloseoutsViewState } from "./use-employee-closeouts-view-state";
import { resolveStoreChannelConfig, channelName } from "@/components/taqfeelah-app/taqfeelah-app-catalog-data";
import type { StoreChannelConfig } from "@/features/org-config/client/org-config-client-types";

import type { EmployeeCloseoutsViewProps, EmployeeHistoryVisibility } from "./employee-closeouts-types";
import type { CloseoutSyncLang, SalesChannelConfig } from "@/features/daily-closeouts/daily-closeouts-types";

function resolveSalesChannelsForStore(
  storeChannelSettings: Record<string, unknown>,
  storeId: string,
  lang: CloseoutSyncLang,
): SalesChannelConfig[] {
  if (!storeId) return [];
  const config = resolveStoreChannelConfig(
    storeChannelSettings as Record<string, StoreChannelConfig | undefined>,
    storeId,
  );
  return (config.channels as SalesChannelConfig[])
    .filter((channel) => config.activeIds.includes(channel.id) && !(channel as SalesChannelConfig & { retired?: boolean }).retired)
    .map((channel) => ({ ...channel, displayName: channelName(channel, lang) }));
}

export default function EmployeeCloseoutsView({
  lang,
  employee,
  currentStore,
  assignedStores,
  onSelectStore,
  salesChannels,
  notebookTheme,
  notebookPattern = "lined",
  employeeHistoryVisibility = "month",
  formatCalendarDate,
  channelLabel,
  settingsPanel,
  onRegisterAdd,
  onRegisterSettingsOpener,
  onEntryActiveChange,
  onCloseoutSubmitted,
  findForStoreDate: findForStoreDateProp,
  saving,
  employeeRuntimeReady = true,
  trustServerDaySequenceOnly = false,
  entryPhaseRef = null,
  pageTitle = "",
  showStorePicker = true,
  attachmentsApiEnabled = false,
  attachmentsApiOrganizationId = "",
  attachmentsApiActorUserId = "",
  attachmentsApiActorRole = "employee",
  sessionDisplayName = "",
  storeChannelSettings = {},
}: EmployeeCloseoutsViewProps) {
  const employeeDisplayName = resolveEmployeeDisplayName(employee, lang, sessionDisplayName);
  const state = useEmployeeCloseoutsViewState({
    lang,
    employee,
    currentStore,
    assignedStores,
    onSelectStore,
    notebookTheme,
    employeeHistoryVisibility: employeeHistoryVisibility as EmployeeHistoryVisibility,
    findForStoreDate: findForStoreDateProp,
    onRegisterAdd,
    onRegisterSettingsOpener,
    onEntryActiveChange,
    onCloseoutSubmitted,
    entryPhaseRef,
    employeeRuntimeReady,
    trustServerDaySequenceOnly,
    salesChannels,
  });

  const {
    viewGate,
    entryCloseout,
    entryOwnerEdit,
    showSettings,
    setShowSettings,
    shareTarget,
    shareNewlySubmitted,
    storeLabel,
    displayCloseouts,
    sameDayCloseoutCountByDate,
    hasOlderHiddenCloseouts,
    historyScopeLabel,
    hiddenCloseoutCount,
    syncError,
    employeeRuntimeReady: runtimeReady,
    channelsReady,
    closeoutsListPending,
    setCardRef,
    toggleExpandedCard,
    handleSubmit,
    handleCancelEntry,
    resolveStoreDate,
    handleEntryStoreSelect,
    setShareTarget,
    setShareNewlySubmitted,
    closeShareModal,
    submitting,
  } = state;

  const entrySalesChannelsResolved = entryCloseout?.storeId
    ? resolveSalesChannelsForStore(storeChannelSettings, entryCloseout.storeId, lang)
    : (salesChannels || []);
  const entryStoreLabel = entryCloseout?.storeId
    ? (resolveCloseoutStoreName({
      preferredStoreName: entryCloseout.storeName,
      closeout: entryCloseout,
      currentStore,
      lang,
    }) || storeLabel)
    : storeLabel;

  if (viewGate === "loading") {
    return (
      <section className="taq-page-gutter pb-28">
        <div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[#827762] ring-1 ring-black/[0.045]">
          {lang === "ar" ? "جاري تحميل إعدادات المحل وطرق الدفع من الخادم…" : "Loading store settings and payment methods from the server…"}
        </div>
      </section>
    );
  }

  if (viewGate === "no-store") {
    return (
      <section className="taq-page-gutter pb-28">
        <div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[#827762] ring-1 ring-black/[0.045]">
          {lang === "ar" ? "لا يوجد محل مرتبط" : "No linked store"}
        </div>
      </section>
    );
  }

  const shareModal = (
    <CloseoutShareModal
      lang={lang}
      open={Boolean(shareTarget)}
      closeout={shareTarget}
      storeName={resolveCloseoutStoreName({ preferredStoreName: shareTarget?.storeName, closeout: shareTarget, currentStore, lang }) || storeLabel}
      employeeName={resolveEmployeeDisplayName(
        employee,
        lang,
        sessionDisplayName
          || shareTarget?.submittedByName
          || shareTarget?.openedByName
          || "",
      )}
      notebookTheme={notebookTheme}
      notebookPattern={notebookPattern}
      formatCalendarDate={formatCalendarDate}
      newlySubmitted={shareNewlySubmitted}
      onClose={closeShareModal}
    />
  );

  return (
    <>
      {entryCloseout ? (
        <div
          className="taq-fixed-app-panel fixed bottom-0 z-[50] overflow-hidden"
          style={{ top: "calc(70px + env(safe-area-inset-top, 0px))" }}
        >
          <DailyCloseoutEntryFlow
            key={`${entryCloseout.id}-${entryCloseout.storeId || "pending"}`}
            lang={lang}
            notebookTheme={notebookTheme}
            notebookPattern={notebookPattern}
            closeout={entryCloseout}
            salesChannels={entrySalesChannelsResolved}
            storeName={entryStoreLabel}
            assignedStores={assignedStores}
            selectedStoreId={entryCloseout.storeId || ""}
            onSelectEntryStore={handleEntryStoreSelect}
            isOwnerEdit={entryOwnerEdit}
            fullScreenOverlay={false}
            saving={saving || submitting}
            channelLabel={channelLabel ? (channel) => channelLabel(channel, lang) : undefined}
            sharePreviewOpen={Boolean(shareTarget && shareNewlySubmitted)}
            onCancel={() => handleCancelEntry(entryCloseout)}
            onSubmit={handleSubmit}
            findForStoreDate={resolveStoreDate}
          />
        </div>
      ) : (
        <NotebookScrollSurface theme={notebookTheme} pattern={notebookPattern} lang={lang}>
          {showSettings && settingsPanel ? (
            settingsPanel({ onBack: () => setShowSettings(false) })
          ) : (
            <EmployeeCloseoutsListPanel
              lang={lang}
              pageTitle={pageTitle}
              employeeDisplayName={employeeDisplayName}
              employeeRuntimeReady={runtimeReady}
              channelsReady={channelsReady}
              syncError={syncError}
              hasOlderHiddenCloseouts={hasOlderHiddenCloseouts}
              historyScopeLabel={historyScopeLabel}
              hiddenCloseoutCount={hiddenCloseoutCount}
              showStorePicker={Boolean(showStorePicker && (assignedStores?.length || 0) <= 1)}
              assignedStores={assignedStores || []}
              currentStore={currentStore}
              onSelectStore={onSelectStore}
              closeoutsListPending={closeoutsListPending}
              displayCloseouts={displayCloseouts}
              sameDayCloseoutCountByDate={sameDayCloseoutCountByDate}
              formatCalendarDate={formatCalendarDate}
              setCardRef={setCardRef}
              toggleExpandedCard={toggleExpandedCard}
              setShareTarget={setShareTarget}
              setShareNewlySubmitted={setShareNewlySubmitted}
              attachmentsApiEnabled={attachmentsApiEnabled}
              attachmentsApiOrganizationId={attachmentsApiOrganizationId}
              attachmentsApiActorUserId={attachmentsApiActorUserId}
              attachmentsApiActorRole={attachmentsApiActorRole}
            />
          )}
        </NotebookScrollSurface>
      )}
      {shareModal}
    </>
  );
}
