"use client";

import NotebookScrollSurface from "../daily-closeouts/NotebookScrollSurface";
import DailyCloseoutEntryFlow from "./DailyCloseoutEntryFlow";
import CloseoutShareModal from "./CloseoutShareModal";
import { resolveCloseoutStoreName } from "./store-name-resolver";
import { EmployeeCloseoutsListPanel } from "./employee-closeouts-list-panel";
import { useEmployeeCloseoutsViewState } from "./use-employee-closeouts-view-state";

export default function EmployeeCloseoutsView({
  lang,
  employee,
  currentStore,
  assignedStores,
  onSelectStore,
  salesChannels,
  notebookTheme,
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
}) {
  const state = useEmployeeCloseoutsViewState({
    lang,
    employee,
    currentStore,
    notebookTheme,
    employeeHistoryVisibility,
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
    listScope,
    setListScope,
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
    setShareTarget,
    setShareNewlySubmitted,
    closeShareModal,
  } = state;

  if (viewGate === "loading") {
    return (
      <section className="taq-page-gutter pb-28">
        <div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[#827762] ring-1 ring-black/[0.045]">
          {lang === "ar" ? "جاري تحميل إعدادات المحل وقنوات البيع من الخادم…" : "Loading store settings and sales channels from the server…"}
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

  if (entryCloseout) {
    return (
      <DailyCloseoutEntryFlow
        lang={lang}
        notebookTheme={notebookTheme}
        closeout={entryCloseout}
        salesChannels={salesChannels}
        storeName={storeLabel}
        isOwnerEdit={entryOwnerEdit}
        saving={saving}
        channelLabel={channelLabel}
        onCancel={() => handleCancelEntry(entryCloseout)}
        onSubmit={handleSubmit}
        findForStoreDate={resolveStoreDate}
      />
    );
  }

  return (
    <>
      <NotebookScrollSurface theme={notebookTheme} lang={lang}>
        {showSettings && settingsPanel ? (
          settingsPanel({ onBack: () => setShowSettings(false) })
        ) : (
          <EmployeeCloseoutsListPanel
            lang={lang}
            pageTitle={pageTitle}
            listScope={listScope}
            setListScope={setListScope}
            employeeRuntimeReady={runtimeReady}
            channelsReady={channelsReady}
            syncError={syncError}
            hasOlderHiddenCloseouts={hasOlderHiddenCloseouts}
            historyScopeLabel={historyScopeLabel}
            hiddenCloseoutCount={hiddenCloseoutCount}
            showStorePicker={showStorePicker}
            assignedStores={assignedStores}
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
      <CloseoutShareModal
        lang={lang}
        open={Boolean(shareTarget)}
        closeout={shareTarget}
        storeName={resolveCloseoutStoreName({ preferredStoreName: shareTarget?.storeName, closeout: shareTarget, currentStore, lang }) || storeLabel}
        employeeName={lang === "ar" ? employee.nameAr : employee.nameEn}
        notebookTheme={notebookTheme}
        formatCalendarDate={formatCalendarDate}
        newlySubmitted={shareNewlySubmitted}
        onClose={closeShareModal}
      />
    </>
  );
}
