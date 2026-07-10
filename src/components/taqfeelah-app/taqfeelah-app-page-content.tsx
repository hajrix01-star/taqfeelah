"use client";

import { useState } from "react";
import EmployeeCloseoutsView from "@/features/employee-closeouts/EmployeeCloseoutsView";
import NotebookScrollSurface from "@/features/daily-closeouts/NotebookScrollSurface";
import { EmployeeSettingsScreen } from "./taqfeelah-app-employee-settings-screen";
import {
  OwnerExpenseScreen,
  OwnerSummaryScreen,
} from "./taqfeelah-app-owner-entry-screens";
import { openWhatsAppSupport } from "./taqfeelah-app-support";
import { OwnerSettingsScreen } from "./OwnerSettingsSection";
import { isOrgConfigApiEnabled } from "@/core/config/org-config-api-mode";
import { OwnerNotebookScreen } from "./taqfeelah-app-owner-notebook-screen";
import { OwnerTargetHeatmapScreen } from "./taqfeelah-app-owner-target-heatmap-screen";
import { OwnerHomeConnected } from "./taqfeelah-app-owner-home-screen";
import { OwnerRegisterConnected } from "./taqfeelah-app-owner-register-connected";
import type { SalesChannelConfig } from "@/features/daily-closeouts/daily-closeouts-types";
import type {
  TaqfeelahAppPageContentProps,
  AppBusiness,
  AppChannel,
  OwnerSettingsApiContext,
} from "./taqfeelah-app-types";

export function TaqfeelahAppPageContent({
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
  notebookPattern,
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
  closeoutsApiEnabled = false,
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
  resolveStoreSalesChannels,
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
  setNotebookPattern,
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
}: TaqfeelahAppPageContentProps) {
  const [ownerSettingsSection, setOwnerSettingsSection] = useState("home");

  const openOwnerSubscriptionSettings = () => {
    setOwnerSettingsSection("subscription");
    setOwnerPage("settings");
  };

  return (
    <>
      {employee && !activeEmployee && (
        <section className="taq-page-gutter pb-24">
          <div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[var(--taq-color-827762)] ring-1 ring-black/[0.045]">
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
            .map((channel) => ({ ...channel, displayName: channelName(channel as AppChannel, lang) })) as SalesChannelConfig[]}
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
          notebookPattern={notebookPattern}
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
            .map((channel) => ({ ...channel, displayName: channelName(channel as AppChannel, lang) })) as SalesChannelConfig[]}
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
          notebookPattern={notebookPattern}
          {...closeoutAttachmentsApiProps}
        />
      )}
      {!employee && ownerPage === "home" && (
        <NotebookScrollSurface theme={notebookTheme} pattern={notebookPattern} lang={lang}>
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
            onShareNotebook={(snapshot) => setShareSnapshot(snapshot as import("./taqfeelah-app-types").AppShareSnapshot)}
            notebookTheme={notebookTheme}
            notebookPattern={notebookPattern}
            selectedBusiness={activeViewBusiness}
            setSelectedBusiness={setSelectedBusiness}
            businessesList={activeBusinesses as AppBusiness[]}
            configuredChannels={homeReportChannelConfig.channels as AppChannel[]}
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
          businessesList={activeBusinesses as AppBusiness[]}
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
          businessesList={activeBusinesses as AppBusiness[]}
          storeOperationalSettings={storeOperationalSettings}
          onBack={() => setOwnerPage("home")}
          onSave={saveOwner}
        />
      )}
      {!employee && ownerPage === "notebook" && (
        <OwnerNotebookScreen
          lang={lang}
          notebookTheme={notebookTheme}
          notebookPattern={notebookPattern}
          organizationId={closeoutsApiOrganizationId ?? undefined}
          userId={ownerApiUserId ?? undefined}
          apiEnabled={ownerNotebookApiEnabled}
        />
      )}
      {!employee && ownerPage === "targets" && (
        <NotebookScrollSurface theme={notebookTheme} pattern={notebookPattern} lang={lang}>
          <OwnerTargetHeatmapScreen
            lang={lang}
            businessesList={activeBusinesses as AppBusiness[]}
            selectedBusiness={selectedBusiness}
            setSelectedBusiness={setSelectedBusiness}
            storeOperationalSettings={storeOperationalSettings}
            setStoreOperationalSettings={setStoreOperationalSettings}
            reportsApiEnabled={entriesApiEnabled}
            reportsApiOrganizationId={closeoutsApiOrganizationId ?? undefined}
            reportsApiActorUserId={ownerApiUserId ?? undefined}
            reportsApiActorRole="owner"
            notebookTheme={notebookTheme}
          />
        </NotebookScrollSurface>
      )}
      {!employee && ownerPage === "register" && (
        <OwnerRegisterConnected
          lang={lang}
          onOpenOperation={handleOpenOwnerOperation}
          onVoidOperation={requestVoidOperation}
          onRestoreOperation={requestRestoreOperation}
          setOwnerEditCloseout={setOwnerEditCloseout as (closeout: import("@/features/daily-closeouts/daily-closeouts-types").DailyCloseoutRecord | null) => void}
          onCloseoutDeleted={handleOwnerCloseoutDeleted as (closeout: import("@/features/daily-closeouts/daily-closeouts-types").DailyCloseoutRecord) => void | Promise<void>}
          onShareRegister={(snapshot) => setShareSnapshot(snapshot as import("./taqfeelah-app-types").AppShareSnapshot)}
          duplicateSummaryFocus={duplicateSummaryFocus as Record<string, unknown> | null}
          archivedReadOnlyBusinessId={archivedReadOnlyBusinessId ?? undefined}
          operationalEntries={operationalEntries}
          selectedBusiness={selectedBusiness ?? undefined}
          setSelectedBusiness={setSelectedBusiness}
          businessesList={reportingBusinesses as AppBusiness[]}
          archivedBusinessIds={archivedBusinessIds}
          notebookTheme={notebookTheme}
          notebookPattern={notebookPattern}
          resolveStoreSalesChannels={resolveStoreSalesChannels}
          registerEntriesApiEnabled={entriesApiEnabled && registerEntriesPaginationEnabled}
          closeoutsApiEnabled={closeoutsApiEnabled}
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
          notebookPattern={notebookPattern}
          setNotebookPattern={setNotebookPattern}
          employeePreferences={employeePreferences}
          ownerShellPreferences={ownerShellPreferences}
          storeChannelSettings={storeChannelSettings}
          setStoreChannelSettings={setStoreChannelSettings}
          storeOperationalSettings={storeOperationalSettings}
          setStoreOperationalSettings={setStoreOperationalSettings}
          configuredBusinesses={configuredBusinesses as AppBusiness[]}
          setConfiguredBusinesses={setConfiguredBusinesses as import("./taqfeelah-app-types").AppSetState<AppBusiness[]>}
          archivedBusinessIds={archivedBusinessIds}
          setArchivedBusinessIds={setArchivedBusinessIds}
          staff={staff as import("@/features/org-config/client/org-config-client-types").StaffMember[]}
          setStaff={setStaff as import("./taqfeelah-app-types").AppSetState<import("@/features/org-config/client/org-config-client-types").StaffMember[]>}
          ownerProfile={ownerProfile}
          setOwnerProfile={setOwnerProfile}
          authOwnerUsername={authOwnerUsername}
          setAuthOwnerUsername={setAuthOwnerUsername}
          authOwnerPassword={authOwnerPassword}
          setAuthOwnerPassword={setAuthOwnerPassword}
          authEmployeePins={authEmployeePins as Record<string, string>}
          setAuthEmployeePins={setAuthEmployeePins as import("./taqfeelah-app-types").AppSetState<Record<string, string>>}
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
                reload: reloadOrgConfig as OwnerSettingsApiContext extends { reload?: infer Reload } ? Reload : never,
                flushPersist: flushOrgConfigPersist as OwnerSettingsApiContext extends { flushPersist?: infer FlushPersist } ? FlushPersist : never,
              }
              : null
          }
        />
      )}
      {saved && (
        <div className="sticky bottom-4 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl bg-[var(--taq-color-112a46)] p-4 text-xs font-bold text-white">
          {text(lang, "savedNotice")}
        </div>
      )}
    </>
  );
}
