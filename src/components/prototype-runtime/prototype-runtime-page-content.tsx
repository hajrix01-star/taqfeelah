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
import type { SalesChannelConfig } from "@/features/daily-closeouts/daily-closeouts-types";
import type { PrototypeRuntimePageContentProps, PrototypeBusiness, PrototypeChannel } from "./prototype-runtime-types";

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
  requestVoidOperation,
  requestRestoreOperation,
  setOwnerEditCloseout,
  handleOwnerCloseoutDeleted,
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
}: PrototypeRuntimePageContentProps) {
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
            .filter((channel) => currentEmployeeChannelConfig.activeIds.includes(String(channel.id)) && !channel.retired)
            .map((channel) => ({ ...channel, displayName: channelName(channel as PrototypeChannel, lang) })) as SalesChannelConfig[]}
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
          assignedStores={activeBusinesses as import("@/features/daily-closeouts/daily-closeouts-types").StoreRef[]}
          onSelectStore={setSelectedBusiness}
          salesChannels={ownerCloseoutChannelConfig.channels
            .filter((channel) => ownerCloseoutChannelConfig.activeIds.includes(String(channel.id)) && !channel.retired)
            .map((channel) => ({ ...channel, displayName: channelName(channel as PrototypeChannel, lang) })) as SalesChannelConfig[]}
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
            duplicateSalesAlerts={duplicateSalesAlerts as Array<Record<string, unknown>>}
            closeoutAlerts={unseenCloseoutAlerts as Array<Record<string, unknown>>}
            onOpenCloseoutAlertInRegister={openCloseoutAlertInRegister}
            onDismissCloseout={dismissCloseoutAlert}
            onOpenDuplicateSummaryInRegister={openDuplicateSummaryInRegister}
            onAcknowledgeDuplicate={acknowledgeDuplicateSales}
            onOpenOperation={handleOpenOwnerOperation}
            onShareNotebook={(snapshot) => setShareSnapshot(snapshot as import("./prototype-runtime-types").PrototypeShareSnapshot)}
            notebookTheme={notebookTheme}
            selectedBusiness={activeViewBusiness}
            setSelectedBusiness={setSelectedBusiness}
            businessesList={activeBusinesses as PrototypeBusiness[]}
            configuredChannels={homeReportChannelConfig.channels as PrototypeChannel[]}
            summaryApiEnabled={entriesApiEnabled}
            summaryApiOrganizationId={closeoutsApiOrganizationId ?? undefined}
            summaryApiActorUserId={ownerApiUserId ?? undefined}
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
          businessesList={activeBusinesses as PrototypeBusiness[]}
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
          businessesList={activeBusinesses as PrototypeBusiness[]}
          storeOperationalSettings={storeOperationalSettings}
          onBack={() => setOwnerPage("home")}
          onSave={saveOwner}
        />
      )}
      {!employee && ownerPage === "notebook" && (
        <OwnerNotebookScreen
          lang={lang}
          notebookTheme={notebookTheme}
          organizationId={closeoutsApiOrganizationId ?? undefined}
          userId={ownerApiUserId ?? undefined}
          apiEnabled={ownerNotebookApiEnabled}
        />
      )}
      {!employee && ownerPage === "register" && (
        <OwnerRegisterConnected
          lang={lang}
          onOpenOperation={handleOpenOwnerOperation}
          onVoidOperation={requestVoidOperation}
          onRestoreOperation={requestRestoreOperation}
          setOwnerEditCloseout={setOwnerEditCloseout as (closeout: import("@/features/daily-closeouts/daily-closeouts-types").DailyCloseoutRecord | null) => void}
          onCloseoutDeleted={handleOwnerCloseoutDeleted as (closeout: import("@/features/daily-closeouts/daily-closeouts-types").DailyCloseoutRecord) => void | Promise<void>}
          onShareRegister={(snapshot) => setShareSnapshot(snapshot as import("./prototype-runtime-types").PrototypeShareSnapshot)}
          duplicateSummaryFocus={duplicateSummaryFocus as Record<string, unknown> | null}
          archivedReadOnlyBusinessId={archivedReadOnlyBusinessId ?? undefined}
          operationalEntries={operationalEntries}
          selectedBusiness={selectedBusiness ?? undefined}
          setSelectedBusiness={setSelectedBusiness}
          businessesList={reportingBusinesses as PrototypeBusiness[]}
          archivedBusinessIds={archivedBusinessIds}
          notebookTheme={notebookTheme}
          registerEntriesApiEnabled={entriesApiEnabled && registerEntriesPaginationEnabled}
          registerEntriesApiOrganizationId={closeoutsApiOrganizationId ?? undefined}
          registerEntriesApiActorUserId={ownerApiUserId ?? undefined}
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
          configuredBusinesses={configuredBusinesses as PrototypeBusiness[]}
          setConfiguredBusinesses={setConfiguredBusinesses as import("./prototype-runtime-types").PrototypeSetState<PrototypeBusiness[]>}
          archivedBusinessIds={archivedBusinessIds}
          setArchivedBusinessIds={setArchivedBusinessIds}
          staff={staff as import("@/features/org-config/client/org-config-client-types").StaffMember[]}
          setStaff={setStaff as import("./prototype-runtime-types").PrototypeSetState<import("@/features/org-config/client/org-config-client-types").StaffMember[]>}
          ownerProfile={ownerProfile}
          setOwnerProfile={setOwnerProfile}
          authOwnerUsername={authOwnerUsername}
          setAuthOwnerUsername={setAuthOwnerUsername}
          authOwnerPassword={authOwnerPassword}
          setAuthOwnerPassword={setAuthOwnerPassword}
          authEmployeePins={authEmployeePins as Record<string, string>}
          setAuthEmployeePins={setAuthEmployeePins as import("./prototype-runtime-types").PrototypeSetState<Record<string, string>>}
          onPersistSettingsNow={() => { void persistRuntimeSettingsNow(); }}
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
                reload: () => { void reloadOrgConfig(); },
                flushPersist: () => { void flushOrgConfigPersist(); },
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
