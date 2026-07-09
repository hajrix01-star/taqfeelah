"use client";

import { DailyCloseoutsProvider } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { AppDialogProvider } from "@/lib/ui/app-dialog/AppDialogProvider";
import { TopBar } from "./taqfeelah-app/taqfeelah-app-chrome";
import { AppFontStyles } from "./taqfeelah-app/taqfeelah-app-font-styles";
import { TaqfeelahAppPullScroll } from "./taqfeelah-app/taqfeelah-app-pull-scroll";
import { useTaqfeelahAppState } from "./taqfeelah-app/use-taqfeelah-app-state";
import {
  TaqfeelahAppLoggedOutGate,
  TaqfeelahAppOrgErrorGate,
  TaqfeelahAppOrgLoadingGate,
  TaqfeelahAppOwnerPasswordGate,
} from "./taqfeelah-app/taqfeelah-app-auth-gates";
import { TaqfeelahAppPageContent } from "./taqfeelah-app/taqfeelah-app-page-content";
import { TaqfeelahAppOverlayStack } from "./taqfeelah-app/taqfeelah-app-overlay-stack";
import { OperationalSyncBridge } from "./taqfeelah-app/OperationalSyncBridge";

export default function TaqfeelahAppRuntimeShell() {
  const state = useTaqfeelahAppState();
  const {
    lang,
    setLang,
    loggedIn,
    mustChangePassword,
    setMustChangePassword,
    authScreen,
    setAuthScreen,
    employee,
    employeeRuntimeReady,
    sessionDisplayName,
    saving,
    saved,
    ownerOrgConfigReady,
    orgConfigSyncError,
    activeBusinesses,
    ownerSettings,
    employeePortal,
    ownerShell,
    ownerCloseout,
    registerSelection,
    operational,
    registerOperations,
    closeoutsApi,
    apiBundle,
    runtimeApiStoresReady,
    runtimeApiAuth,
    auth,
    saveOwner,
    saveOwnerSummary,
    handleEmployeeNotebookThemeSave,
    helpOpen,
    setHelpOpen,
    ENTRIES_API_DB_SOURCE,
    REGISTER_ENTRIES_PAGINATION_ENABLED,
    CLOSEOUTS_API_DB_SOURCE,
    ORG_CONFIG_API_ENABLED,
    entriesApiEnabled,
    phase9ApiEnabled,
    closeoutsApiEnabled,
    closeoutsApiStrictMode,
    closeoutsApiOrganizationId,
    ownerApiUserId,
    ownerNotebookApiEnabled,
    reportingBusinesses,
    archivedBusinessIds,
    notebookTheme,
    setNotebookTheme,
    notebookPattern,
    setNotebookPattern,
    employeePreferences,
    ownerShellPreferences,
    persistRuntimeSettingsNow,
    resolveStoreSalesChannels,
    channelName,
    text,
    formatCalendarDate,
    operationalSync,
  } = state;

  const {
    staff,
    setStaff,
    ownerProfile,
    setOwnerProfile,
    storeChannelSettings,
    setStoreChannelSettings,
    storeOperationalSettings,
    setStoreOperationalSettings,
    configuredBusinesses,
    setConfiguredBusinesses,
    setArchivedBusinessIds,
    authOwnerUsername,
    setAuthOwnerUsername,
    authOwnerPassword,
    setAuthOwnerPassword,
    authEmployeePins,
    setAuthEmployeePins,
    setLastCloseoutDates,
    reloadOrgConfig,
    flushOrgConfigPersist,
    orgConfigLoading,
    orgConfigHydrated,
    ownerDisplayName,
  } = ownerSettings;

  const {
    employeePage,
    changeEmployeePage,
    setEmployeeBusinessId,
    employeeThemeOverride,
    employeeEntryActive,
    setEmployeeEntryActive,
    employeeAddHandlerRef,
    employeeSettingsOpenerRef,
    activeEmployee,
    assignedEmployeeBusinesses,
    currentEmployeeBusiness,
    currentEmployeeChannelConfig,
    currentEmployeeOperationalConfig,
    employeeNotebookTheme,
  } = employeePortal;

  const {
    ownerPage,
    setOwnerPage,
    selectedBusiness,
    setSelectedBusiness,
    archivedReadOnlyBusinessId,
    setArchivedReadOnlyBusinessId,
    quickAddOpen,
    setQuickAddOpen,
    ownerManageCloseout,
    setOwnerManageCloseout,
    duplicateSummaryFocus,
    shareSnapshot,
    setShareSnapshot,
    activeViewBusiness,
    duplicateSalesAlerts,
    unseenCloseoutAlerts,
    openCloseoutAlertInRegister,
    dismissCloseoutAlert,
    openDuplicateSummaryInRegister,
    changeOwnerPage,
    openNotifications,
    ownerNotificationsVisible,
    ownerNotificationBadge,
  } = ownerShell;

  const {
    ownerAddHandlerRef,
    ownerEntryActive,
    setOwnerEntryActive,
    ownerEditCloseout,
    setOwnerEditCloseout,
    ownerCloseoutActor,
    ownerCloseoutBusiness,
    ownerCloseoutChannelConfig,
    homeReportChannelConfig,
    handleOpenQuickAddSummary,
    handleOpenQuickAddExpense,
    handleOwnerQuickAddOpen,
    handleOwnerCloseoutUpdated,
    handleOwnerCloseoutDeleted,
  } = ownerCloseout;

  const {
    selected,
    setSelected,
    voidTarget,
    setVoidTarget,
    restoreTarget,
    setRestoreTarget,
    savedOutflowShareTarget,
    setSavedOutflowShareTarget,
    pendingDuplicateSummary,
    setPendingDuplicateSummary,
  } = registerSelection;

  const {
    operationalEntries,
    operationalEntriesLoading,
    loadOperationalEntriesFromApi,
    syncCloseoutToOperationalEntries,
  } = operational;

  const {
    handleOpenOwnerOperation,
    requestVoidOperation,
    requestRestoreOperation,
    confirmVoidOperation,
    confirmRestoreOperation,
    confirmDuplicateSummary,
    acknowledgeDuplicateSales,
  } = registerOperations;

  const {
    syncSubmitCloseoutToApi,
    syncDeleteCloseoutToApi,
    loadCloseoutsFromApi,
  } = closeoutsApi;

  const {
    closeoutsAutoLoadQueryKey,
    closeoutAttachmentsApiProps,
    ownerCloseoutAttachmentsApiProps,
    entryAttachmentsApiProps,
  } = apiBundle;

  if (loggedIn && mustChangePassword && !employee) {
    return (
      <TaqfeelahAppOwnerPasswordGate
        lang={lang}
        setLang={setLang}
        onComplete={() => setMustChangePassword(false)}
        onLogout={() => { void auth.logout(); }}
      />
    );
  }

  if (!loggedIn) {
    return (
      <TaqfeelahAppLoggedOutGate
        lang={lang}
        setLang={setLang}
        authScreen={authScreen}
        setAuthScreen={setAuthScreen}
        staff={staff}
        onOwnerLogin={auth.completeOwnerLogin}
        onEmployeeLogin={auth.completeEmployeeLogin}
      />
    );
  }

  if (ORG_CONFIG_API_ENABLED && !employee && !ownerOrgConfigReady && !orgConfigSyncError) {
    return <TaqfeelahAppOrgLoadingGate lang={lang} />;
  }

  if (ORG_CONFIG_API_ENABLED && !employee && activeBusinesses.length === 0 && orgConfigSyncError) {
    return (
      <TaqfeelahAppOrgErrorGate
        lang={lang}
        orgConfigSyncError={orgConfigSyncError}
      />
    );
  }

  return (
    <AppDialogProvider lang={lang}>
    <DailyCloseoutsProvider
      lang={lang}
      ownerName={ownerDisplayName}
      onSyncToOperationalEntries={syncCloseoutToOperationalEntries as (closeout: import("@/features/daily-closeouts/daily-closeouts-types").DailyCloseoutRecord) => void | Promise<void>}
      onSubmitCloseoutToApi={syncSubmitCloseoutToApi}
      onDeleteCloseoutToApi={async (params) => {
        await syncDeleteCloseoutToApi(params);
      }}
      loadCloseoutsFromApi={
        closeoutsApiEnabled
        && closeoutsApiOrganizationId
        && runtimeApiStoresReady
          ? loadCloseoutsFromApi
          : null
      }
      closeoutsAutoLoadQueryKey={closeoutsAutoLoadQueryKey}
      apiStrictMode={closeoutsApiStrictMode}
      dbSourceMode={CLOSEOUTS_API_DB_SOURCE}
    >
      <OperationalSyncBridge
        enabled={operationalSync.enabled}
        organizationId={operationalSync.organizationId}
        actorUserId={operationalSync.actorUserId}
        actorRole={operationalSync.actorRole}
        employee={employee}
        ownerPage={ownerPage}
        employeePage={employeePage}
        ownerEntryActive={ownerEntryActive}
        employeeEntryActive={employeeEntryActive}
        reloadOperationalEntries={loadOperationalEntriesFromApi}
        closeoutsSyncEnabled={operationalSync.closeoutsSyncEnabled}
        entriesSyncEnabled={operationalSync.entriesSyncEnabled}
        notifyLocalWriteRef={operationalSync.notifyRef}
      />
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="taq-app-root min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
        <AppFontStyles />
        <main className="taq-shell relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#F8F6F0]">
          <div className="taq-screen relative grid h-[100dvh] max-h-[100dvh] grid-rows-[auto_1fr_auto] overflow-hidden bg-[#F8F6F0]">
            <TopBar
              lang={lang}
              setLang={setLang}
              employee={employee}
              notebookMode={employee || (!employee && (ownerPage === "home" || ownerPage === "register" || ownerPage === "notebook" || ownerPage === "closeouts"))}
              notebookTheme={employee ? employeeNotebookTheme : notebookTheme}
              notebookPattern={notebookPattern}
              onLogout={auth.logout}
              onEmployeeSettings={() => employeeSettingsOpenerRef.current?.()}
              onNotifications={openNotifications}
              showNotifications={ownerNotificationsVisible}
              hasNotificationBadge={ownerNotificationBadge}
            />
            <TaqfeelahAppPullScroll
              lang={lang}
              employee={employee}
              ownerPage={ownerPage}
              employeePage={employeePage}
              employeeEntryActive={employeeEntryActive}
              ownerEntryActive={ownerEntryActive}
              ownerEditActive={Boolean(ownerEditCloseout)}
              hasActiveEmployee={Boolean(activeEmployee)}
              notebookTheme={employee ? employeeNotebookTheme : notebookTheme}
              notebookPattern={notebookPattern}
              onRefreshOperationalEntries={loadOperationalEntriesFromApi}
            >
              <TaqfeelahAppPageContent
                lang={lang}
                text={text}
                channelName={channelName}
                formatCalendarDate={formatCalendarDate}
                employee={employee}
                employeePage={employeePage}
                activeEmployee={activeEmployee}
                sessionDisplayName={sessionDisplayName}
                employeeRuntimeReady={employeeRuntimeReady}
                currentEmployeeBusiness={currentEmployeeBusiness}
                assignedEmployeeBusinesses={assignedEmployeeBusinesses}
                setEmployeeBusinessId={setEmployeeBusinessId}
                currentEmployeeChannelConfig={currentEmployeeChannelConfig}
                employeeNotebookTheme={employeeNotebookTheme}
                notebookPattern={notebookPattern}
                employeeThemeOverride={employeeThemeOverride}
                currentEmployeeOperationalConfig={currentEmployeeOperationalConfig}
                handleEmployeeNotebookThemeSave={handleEmployeeNotebookThemeSave}
                setHelpOpen={setHelpOpen}
                setEmployeeEntryActive={setEmployeeEntryActive}
                employeeAddHandlerRef={employeeAddHandlerRef}
                employeeSettingsOpenerRef={employeeSettingsOpenerRef}
                saving={saving}
                closeoutsApiDbSource={CLOSEOUTS_API_DB_SOURCE}
                closeoutAttachmentsApiProps={closeoutAttachmentsApiProps}
                ownerPage={ownerPage}
                ownerCloseoutActor={ownerCloseoutActor}
                runtimeApiStoresReady={runtimeApiStoresReady}
                ownerCloseoutBusiness={ownerCloseoutBusiness}
                activeBusinesses={activeBusinesses}
                setSelectedBusiness={setSelectedBusiness}
                ownerCloseoutChannelConfig={ownerCloseoutChannelConfig}
                notebookTheme={notebookTheme}
                setOwnerEntryActive={setOwnerEntryActive}
                ownerAddHandlerRef={ownerAddHandlerRef}
                setOwnerPage={setOwnerPage}
                entriesApiDbSource={ENTRIES_API_DB_SOURCE}
                operationalEntries={operationalEntries}
                operationalEntriesLoading={operationalEntriesLoading}
                duplicateSalesAlerts={duplicateSalesAlerts}
                unseenCloseoutAlerts={unseenCloseoutAlerts}
                openCloseoutAlertInRegister={openCloseoutAlertInRegister}
                dismissCloseoutAlert={dismissCloseoutAlert}
                openDuplicateSummaryInRegister={openDuplicateSummaryInRegister}
                acknowledgeDuplicateSales={acknowledgeDuplicateSales}
                handleOpenOwnerOperation={handleOpenOwnerOperation}
                requestVoidOperation={requestVoidOperation}
                requestRestoreOperation={requestRestoreOperation}
                setOwnerEditCloseout={setOwnerEditCloseout}
                handleOwnerCloseoutDeleted={handleOwnerCloseoutDeleted}
                setShareSnapshot={setShareSnapshot}
                activeViewBusiness={activeViewBusiness}
                homeReportChannelConfig={homeReportChannelConfig}
                entriesApiEnabled={entriesApiEnabled}
                closeoutsApiEnabled={closeoutsApiEnabled}
                closeoutsApiOrganizationId={closeoutsApiOrganizationId}
                ownerApiUserId={ownerApiUserId}
                ownerNotebookApiEnabled={ownerNotebookApiEnabled}
                entryAttachmentsApiProps={entryAttachmentsApiProps}
                saveOwnerSummary={saveOwnerSummary}
                saveOwner={saveOwner}
                storeChannelSettings={storeChannelSettings}
                storeOperationalSettings={storeOperationalSettings}
                duplicateSummaryFocus={duplicateSummaryFocus}
                archivedReadOnlyBusinessId={archivedReadOnlyBusinessId}
                selectedBusiness={selectedBusiness}
                reportingBusinesses={reportingBusinesses}
                archivedBusinessIds={archivedBusinessIds}
                registerEntriesPaginationEnabled={REGISTER_ENTRIES_PAGINATION_ENABLED}
                resolveStoreSalesChannels={resolveStoreSalesChannels}
                configuredBusinesses={configuredBusinesses}
                setConfiguredBusinesses={setConfiguredBusinesses}
                setArchivedBusinessIds={setArchivedBusinessIds}
                staff={staff}
                setStaff={setStaff}
                ownerProfile={ownerProfile}
                setOwnerProfile={setOwnerProfile}
                authOwnerUsername={authOwnerUsername}
                setAuthOwnerUsername={setAuthOwnerUsername}
                authOwnerPassword={authOwnerPassword}
                setAuthOwnerPassword={setAuthOwnerPassword}
                authEmployeePins={authEmployeePins}
                setAuthEmployeePins={setAuthEmployeePins}
                employeePreferences={employeePreferences}
                ownerShellPreferences={ownerShellPreferences}
                setNotebookTheme={setNotebookTheme}
                setNotebookPattern={setNotebookPattern}
                setStoreChannelSettings={setStoreChannelSettings}
                setStoreOperationalSettings={setStoreOperationalSettings}
                setArchivedReadOnlyBusinessId={setArchivedReadOnlyBusinessId}
                setLastCloseoutDates={setLastCloseoutDates}
                persistRuntimeSettingsNow={persistRuntimeSettingsNow}
                reloadOrgConfig={reloadOrgConfig}
                flushOrgConfigPersist={flushOrgConfigPersist}
                orgConfigLoading={orgConfigLoading}
                orgConfigHydrated={orgConfigHydrated}
                logout={auth.logout}
                saved={saved}
              />
            </TaqfeelahAppPullScroll>
            <TaqfeelahAppOverlayStack
              lang={lang}
              employee={employee}
              employeePage={employeePage}
              ownerPage={ownerPage}
              employeeEntryActive={employeeEntryActive}
              ownerEntryActive={ownerEntryActive}
              employeeAddHandlerRef={employeeAddHandlerRef}
              handleOwnerQuickAddOpen={handleOwnerQuickAddOpen}
              changeEmployeePage={changeEmployeePage}
              changeOwnerPage={changeOwnerPage}
              setQuickAddOpen={setQuickAddOpen}
              quickAddOpen={quickAddOpen}
              handleOpenQuickAddSummary={handleOpenQuickAddSummary}
              handleOpenQuickAddExpense={handleOpenQuickAddExpense}
              selected={selected}
              setSelected={setSelected}
              requestVoidOperation={requestVoidOperation}
              requestRestoreOperation={requestRestoreOperation}
              archivedBusinessIds={archivedBusinessIds}
              entryAttachmentsApiProps={entryAttachmentsApiProps}
              pendingDuplicateSummary={pendingDuplicateSummary}
              setPendingDuplicateSummary={setPendingDuplicateSummary}
              activeBusinesses={activeBusinesses}
              confirmDuplicateSummary={confirmDuplicateSummary}
              voidTarget={voidTarget}
              setVoidTarget={setVoidTarget}
              confirmVoidOperation={confirmVoidOperation}
              restoreTarget={restoreTarget}
              setRestoreTarget={setRestoreTarget}
              confirmRestoreOperation={confirmRestoreOperation}
              savedOutflowShareTarget={savedOutflowShareTarget}
              setSavedOutflowShareTarget={setSavedOutflowShareTarget}
              shareSnapshot={shareSnapshot}
              setShareSnapshot={setShareSnapshot}
              reportingBusinesses={reportingBusinesses}
              operationalEntries={operationalEntries}
              phase9ApiEnabled={phase9ApiEnabled}
              entriesApiEnabled={entriesApiEnabled}
              closeoutsApiEnabled={closeoutsApiEnabled}
              runtimeApiAuth={runtimeApiAuth}
              ownerManageCloseout={ownerManageCloseout}
              ownerDisplayName={ownerDisplayName}
              notebookTheme={notebookTheme}
              resolveStoreSalesChannels={resolveStoreSalesChannels}
              channelName={channelName}
              handleOwnerCloseoutUpdated={handleOwnerCloseoutUpdated}
              handleOwnerCloseoutDeleted={handleOwnerCloseoutDeleted}
              setOwnerManageCloseout={setOwnerManageCloseout}
              ownerEditCloseout={ownerEditCloseout}
              setOwnerEditCloseout={setOwnerEditCloseout}
              ownerCloseoutActor={ownerCloseoutActor}
              ownerCloseoutAttachmentsApiProps={ownerCloseoutAttachmentsApiProps}
              helpOpen={helpOpen}
              setHelpOpen={setHelpOpen}
            />
          </div>
        </main>
      </div>
    </DailyCloseoutsProvider>
    </AppDialogProvider>
  );
}
