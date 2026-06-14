"use client";

import { useState } from "react";
import EmployeeCloseoutsView from "@/features/employee-closeouts/EmployeeCloseoutsView";
import NotebookScrollSurface from "@/features/daily-closeouts/NotebookScrollSurface";
import { EmployeeSettingsScreen } from "./prototype-runtime-employee-settings-screen";
import {
  OwnerExpenseScreen,
  OwnerSummaryScreen,
} from "./prototype-runtime-owner-entry-screens";
import { openWhatsAppSupport } from "./prototype-runtime-support";
import { OwnerSettingsScreen } from "./OwnerSettingsSection";
import { isOrgConfigApiEnabled } from "@/core/config/org-config-api-mode";
import { OwnerNotebookScreen } from "./prototype-runtime-owner-notebook-screen";
import { OwnerHomeConnected } from "./prototype-runtime-owner-home-screen";
import { OwnerRegisterConnected } from "./prototype-runtime-owner-register-screen";

export function PrototypeRuntimePageContent({
  lang,
  text,
  channelName,
  formatCalendarDate,
  employee,
  employeePage,
  activeEmployee,
  sessionDisplayName = "",
  employeeRuntimeReady,
  currentEmployeeBusiness,
  assignedEmployeeBusinesses,
  setEmployeeBusinessId,
  currentEmployeeChannelConfig,
  employeeNotebookTheme,
  employeeThemeOverride,
  currentEmployeeOperationalConfig,
  handleEmployeeNotebookThemeSave,
  setHelpOpen,
  setEmployeeEntryActive,
  employeeAddHandlerRef,
  employeeSettingsOpenerRef,
  saving,
  closeoutsApiDbSource,
  closeoutAttachmentsApiProps,
  ownerPage,
  ownerCloseoutActor,
  runtimeApiStoresReady,
  ownerCloseoutBusiness,
  activeBusinesses,
  setSelectedBusiness,
  ownerCloseoutChannelConfig,
  notebookTheme,
  setOwnerEntryActive,
  ownerAddHandlerRef,
  setOwnerPage,
  entriesApiDbSource,
  operationalEntries,
  operationalEntriesLoading,
  duplicateSalesAlerts,
  unseenCloseoutAlerts,
  openCloseoutAlertInRegister,
  dismissCloseoutAlert,
  openDuplicateSummaryInRegister,
  acknowledgeDuplicateSales,
  handleOpenOwnerOperation,
  setShareSnapshot,
  activeViewBusiness,
  homeReportChannelConfig,
  entriesApiEnabled,
  closeoutsApiOrganizationId,
  ownerApiUserId,
  ownerNotebookApiEnabled = false,
  entryAttachmentsApiProps,
  saveOwnerSummary,
  saveOwner,
  storeChannelSettings,
  storeOperationalSettings,
  duplicateSummaryFocus,
  archivedReadOnlyBusinessId,
  selectedBusiness,
  reportingBusinesses,
  archivedBusinessIds,
  registerEntriesPaginationEnabled,
  configuredBusinesses,
  setConfiguredBusinesses,
  setArchivedBusinessIds,
  staff,
  setStaff,
  ownerProfile,
  setOwnerProfile,
  authOwnerUsername,
  setAuthOwnerUsername,
  authOwnerPassword,
  setAuthOwnerPassword,
  authEmployeePins,
  setAuthEmployeePins,
  employeePreferences,
  ownerShellPreferences,
  setNotebookTheme,
  setStoreChannelSettings,
  setStoreOperationalSettings,
  setArchivedReadOnlyBusinessId,
  setLastCloseoutDates,
  persistRuntimeSettingsNow,
  reloadOrgConfig,
  flushOrgConfigPersist,
  orgConfigLoading = false,
  orgConfigHydrated = false,
  logout,
  saved,
}) {
  const [ownerSettingsSection, setOwnerSettingsSection] = useState("home");

  const openOwnerSubscriptionSettings = () => {
    setOwnerSettingsSection("subscription");
    setOwnerPage("settings");
  };

  return (
    <>
      {employee && !activeEmployee && (
        <section className="taq-page-gutter pb-24">
          <div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[#827762] ring-1 ring-black/[0.045]">
            {text(lang, "noActiveEmployee")}
          </div>
        </section>
      )}
      {employee && activeEmployee && employeePage === "closeouts" && (
        <EmployeeCloseoutsView
          lang={lang}
          employee={activeEmployee}
          sessionDisplayName={sessionDisplayName}
          employeeRuntimeReady={employeeRuntimeReady}
          currentStore={currentEmployeeBusiness}
          assignedStores={assignedEmployeeBusinesses}
          onSelectStore={setEmployeeBusinessId}
          salesChannels={currentEmployeeChannelConfig.channels
            .filter((channel) => currentEmployeeChannelConfig.activeIds.includes(channel.id) && !channel.retired)
            .map((channel) => ({ ...channel, displayName: channelName(channel, lang) }))}
          notebookTheme={employeeNotebookTheme}
          employeeHistoryVisibility={currentEmployeeOperationalConfig.employeeHistoryVisibility || "month"}
          formatCalendarDate={formatCalendarDate}
          channelLabel={(channel) => channel.displayName || channelName(channel, lang)}
          settingsPanel={({ onBack }) => (
            <EmployeeSettingsScreen
              lang={lang}
              onBack={onBack}
              currentStore={currentEmployeeBusiness}
              assignedStores={assignedEmployeeBusinesses}
              onSelectStore={setEmployeeBusinessId}
              employeeNotebookTheme={employeeThemeOverride || employeeNotebookTheme}
              setEmployeeNotebookTheme={handleEmployeeNotebookThemeSave}
              onOpenSupport={() => openWhatsAppSupport(lang)}
              onOpenHelp={() => setHelpOpen(true)}
            />
          )}
          onEntryActiveChange={setEmployeeEntryActive}
          onRegisterAdd={(handler) => { employeeAddHandlerRef.current = handler || (() => {}); }}
          onRegisterSettingsOpener={(handler) => { employeeSettingsOpenerRef.current = handler || (() => {}); }}
          saving={saving}
          trustServerDaySequenceOnly={closeoutsApiDbSource}
          storeChannelSettings={storeChannelSettings}
          {...closeoutAttachmentsApiProps}
        />
      )}
      {!employee && ownerPage === "closeouts" && (
        <EmployeeCloseoutsView
          lang={lang}
          employee={ownerCloseoutActor}
          employeeRuntimeReady={runtimeApiStoresReady}
          currentStore={
            activeBusinesses.length > 1 && activeViewBusiness === "all"
              ? null
              : ownerCloseoutBusiness
          }
          assignedStores={activeBusinesses}
          onSelectStore={setSelectedBusiness}
          salesChannels={ownerCloseoutChannelConfig.channels
            .filter((channel) => ownerCloseoutChannelConfig.activeIds.includes(channel.id) && !channel.retired)
            .map((channel) => ({ ...channel, displayName: channelName(channel, lang) }))}
          notebookTheme={notebookTheme}
          employeeHistoryVisibility="all"
          formatCalendarDate={formatCalendarDate}
          channelLabel={(channel) => channel.displayName || channelName(channel, lang)}
          onRegisterAdd={(handler) => { ownerAddHandlerRef.current = handler || (() => {}); }}
          onEntryActiveChange={setOwnerEntryActive}
          saving={saving}
          trustServerDaySequenceOnly={closeoutsApiDbSource}
          pageTitle={lang === "ar" ? "تسجيل تقفيلة" : "Record closeout"}
          onCloseoutSubmitted={() => setOwnerPage("home")}
          storeChannelSettings={storeChannelSettings}
          {...closeoutAttachmentsApiProps}
        />
      )}
      {!employee && ownerPage === "home" && (
        <NotebookScrollSurface theme={notebookTheme} lang={lang}>
          <OwnerHomeConnected
            lang={lang}
            ownerProfile={ownerProfile}
            onOpenSubscriptionSettings={openOwnerSubscriptionSettings}
            operationalEntries={operationalEntries}
            operationalEntriesLoading={operationalEntriesLoading}
            duplicateSalesAlerts={duplicateSalesAlerts}
            closeoutAlerts={unseenCloseoutAlerts}
            onOpenCloseoutAlertInRegister={openCloseoutAlertInRegister}
            onDismissCloseout={dismissCloseoutAlert}
            onOpenDuplicateSummaryInRegister={openDuplicateSummaryInRegister}
            onAcknowledgeDuplicate={acknowledgeDuplicateSales}
            onOpenOperation={handleOpenOwnerOperation}
            onShareNotebook={setShareSnapshot}
            notebookTheme={notebookTheme}
            selectedBusiness={activeViewBusiness}
            setSelectedBusiness={setSelectedBusiness}
            businessesList={activeBusinesses}
            configuredChannels={homeReportChannelConfig.channels}
            summaryApiEnabled={entriesApiEnabled}
            summaryApiOrganizationId={closeoutsApiOrganizationId}
            summaryApiActorUserId={ownerApiUserId}
            summaryApiActorRole="owner"
            {...entryAttachmentsApiProps}
          />
        </NotebookScrollSurface>
      )}
      {!employee && ownerPage === "add-summary" && !entriesApiDbSource && (
        <OwnerSummaryScreen
          lang={lang}
          saving={saving}
          selectedBusiness={activeViewBusiness}
          businessesList={activeBusinesses}
          storeChannelSettings={storeChannelSettings}
          onBack={() => setOwnerPage("home")}
          onSave={saveOwnerSummary}
        />
      )}
      {!employee && ownerPage === "add-expense" && (
        <OwnerExpenseScreen
          lang={lang}
          saving={saving}
          selectedBusiness={activeViewBusiness}
          businessesList={activeBusinesses}
          storeOperationalSettings={storeOperationalSettings}
          onBack={() => setOwnerPage("home")}
          onSave={saveOwner}
        />
      )}
      {!employee && ownerPage === "notebook" && (
        <OwnerNotebookScreen
          lang={lang}
          notebookTheme={notebookTheme}
          organizationId={closeoutsApiOrganizationId}
          userId={ownerApiUserId}
          apiEnabled={ownerNotebookApiEnabled}
        />
      )}
      {!employee && ownerPage === "register" && (
        <OwnerRegisterConnected
          lang={lang}
          onOpenOperation={handleOpenOwnerOperation}
          onShareRegister={setShareSnapshot}
          duplicateSummaryFocus={duplicateSummaryFocus}
          archivedReadOnlyBusinessId={archivedReadOnlyBusinessId}
          operationalEntries={operationalEntries}
          selectedBusiness={selectedBusiness}
          setSelectedBusiness={setSelectedBusiness}
          businessesList={reportingBusinesses}
          archivedBusinessIds={archivedBusinessIds}
          notebookTheme={notebookTheme}
          registerEntriesApiEnabled={entriesApiEnabled && registerEntriesPaginationEnabled}
          registerEntriesApiOrganizationId={closeoutsApiOrganizationId}
          registerEntriesApiActorUserId={ownerApiUserId}
          registerEntriesApiActorRole="owner"
          {...entryAttachmentsApiProps}
        />
      )}
      {!employee && ownerPage === "settings" && (
        <OwnerSettingsScreen
          lang={lang}
          initialSettingsSection={ownerSettingsSection}
          operationalEntries={operationalEntries}
          selectedBusiness={selectedBusiness}
          setSelectedBusiness={setSelectedBusiness}
          setOwnerPage={setOwnerPage}
          setArchivedReadOnlyBusinessId={setArchivedReadOnlyBusinessId}
          setLastCloseoutDates={setLastCloseoutDates}
          notebookTheme={notebookTheme}
          setNotebookTheme={setNotebookTheme}
          employeePreferences={employeePreferences}
          ownerShellPreferences={ownerShellPreferences}
          storeChannelSettings={storeChannelSettings}
          setStoreChannelSettings={setStoreChannelSettings}
          storeOperationalSettings={storeOperationalSettings}
          setStoreOperationalSettings={setStoreOperationalSettings}
          configuredBusinesses={configuredBusinesses}
          setConfiguredBusinesses={setConfiguredBusinesses}
          archivedBusinessIds={archivedBusinessIds}
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
          onPersistSettingsNow={persistRuntimeSettingsNow}
          onLogout={logout}
          onOpenSupport={() => openWhatsAppSupport(lang)}
          onOpenHelp={() => setHelpOpen(true)}
          inviteApiContext={
            closeoutsApiOrganizationId && ownerApiUserId
              ? {
                organizationId: closeoutsApiOrganizationId,
                actorUserId: ownerApiUserId,
                actorRole: "owner",
              }
              : null
          }
          billingApiContext={
            closeoutsApiOrganizationId && ownerApiUserId
              ? {
                organizationId: closeoutsApiOrganizationId,
                actorUserId: ownerApiUserId,
                actorRole: "owner",
              }
              : null
          }
          orgConfigApiContext={
            closeoutsApiOrganizationId && ownerApiUserId && isOrgConfigApiEnabled()
              ? {
                enabled: true,
                organizationId: closeoutsApiOrganizationId,
                actorUserId: ownerApiUserId,
                actorRole: "owner",
                loading: orgConfigLoading,
                hydrated: orgConfigHydrated,
                reload: reloadOrgConfig,
                flushPersist: flushOrgConfigPersist,
              }
              : null
          }
        />
      )}
      {saved && (
        <div className="sticky bottom-4 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl bg-[#112A46] p-4 text-xs font-bold text-white">
          {text(lang, "savedNotice")}
        </div>
      )}
    </>
  );
}
