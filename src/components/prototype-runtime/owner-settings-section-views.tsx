"use client";

import React from "react";
import { OwnerSettingsAccountSection } from "./owner-settings-account-section";
import { OwnerSettingsAppearanceSection } from "./owner-settings-appearance-section";
import { OwnerSettingsHomeSection } from "./owner-settings-home-section";
import { OwnerSettingsStoresSection } from "./owner-settings-stores-section";
import { OwnerSettingsSupportSection } from "./owner-settings-support-section";
import { OwnerSettingsTeamSection } from "./owner-settings-team-section";
import { SettingsSectionFrame } from "./owner-settings-section-frame";
import type {
  OwnerSettingsSectionCommonProps,
  OwnerSettingsSectionRenderOptions,
  OwnerSettingsTabbedShellCallbacks,
  OwnerSettingsViewState,
} from "./prototype-runtime-types";
import type { StaffMember } from "@/features/org-config/client/org-config-client-types";

export function OwnerSettingsStoresTeamSection(props: OwnerSettingsViewState & OwnerSettingsSectionCommonProps) {
  const {
    visibleStaff,
    employeeStoreIds,
    embedded = true,
  } = props;

  const countEmployeesForStore = React.useCallback((storeId: string) => (
    (visibleStaff as StaffMember[]).filter((person) => (employeeStoreIds as (person: StaffMember) => string[])(person).includes(storeId)).length
  ), [visibleStaff, employeeStoreIds]);

  return (
    <SettingsSectionFrame embedded={embedded}>
      <OwnerSettingsStoresSection
        {...props as React.ComponentProps<typeof OwnerSettingsStoresSection>}
        embedded={embedded}
        countEmployeesForStore={countEmployeesForStore}
      />
      <div className="my-4 border-t border-[#E8E1D4]/90" />
      <OwnerSettingsTeamSection
        {...props as React.ComponentProps<typeof OwnerSettingsTeamSection>}
        embedded={embedded}
      />
    </SettingsSectionFrame>
  );
}

export function renderOwnerSettingsSection(
  section: string,
  state: OwnerSettingsViewState,
  callbacks: OwnerSettingsTabbedShellCallbacks,
  options: OwnerSettingsSectionRenderOptions = {},
) {
  const { onLogout, onOpenSupport, onOpenHelp } = callbacks;
  const { embedded = false } = options;
  const common = { lang: state.lang, setSection: state.setSection, embedded };

  if (section === "account") {
    return (
      <OwnerSettingsAccountSection
        {...common}
        draftOwnerName={state.draftOwnerName}
        setDraftOwnerName={state.setDraftOwnerName}
        draftAuthOwnerUsername={state.draftAuthOwnerUsername}
        setDraftAuthOwnerUsername={state.setDraftAuthOwnerUsername}
        draftAuthOwnerPassword={state.draftAuthOwnerPassword}
        setDraftAuthOwnerPassword={state.setDraftAuthOwnerPassword}
        ownerProfileDirty={state.ownerProfileDirty}
        authDirty={state.authDirty}
        saveOwnerProfile={state.saveOwnerProfile}
        saveAuthCredentials={state.saveAuthCredentials}
        settingsNotice={state.settingsNotice}
        settingsSuccess={state.settingsSuccess}
        serverAuthMode={state.serverAuthMode}
        ownerAccount={state.ownerAccount}
        ownerAccountLoading={state.ownerAccountLoading}
        ownerAccountError={state.ownerAccountError}
        reloadOwnerAccount={state.reloadOwnerAccount}
      />
    );
  }
  if (section === "stores-team" || section === "stores" || section === "team") {
    return (
      <OwnerSettingsStoresTeamSection
        {...common}
        showAddStore={state.showAddStore}
        setShowAddStore={state.setShowAddStore}
        newStoreName={state.newStoreName}
        setNewStoreName={state.setNewStoreName}
        newStoreLocation={state.newStoreLocation}
        setNewStoreLocation={state.setNewStoreLocation}
        addStore={state.addStore}
        activeStoredBusinesses={state.activeStoredBusinesses}
        archivedStoredBusinesses={state.archivedStoredBusinesses}
        showArchivedStores={state.showArchivedStores}
        setShowArchivedStores={state.setShowArchivedStores}
        displayBusinessName={state.displayBusinessName}
        displayLocation={state.displayLocation}
        openStore={state.openStore}
        deleteDialogProps={state.deleteDialogProps}
        orgConfigLoading={state.orgConfigApiContext?.loading}
        storeSaving={state.storeSaving}
        settingsNotice={state.settingsNotice}
        settingsSuccess={state.settingsSuccess}
        entitlements={state.entitlements}
        managingTeam={state.managingTeam}
        startManagingTeam={state.startManagingTeam}
        cancelManagingTeam={state.cancelManagingTeam}
        visibleStaff={state.visibleStaff}
        employeeStoreIds={state.employeeStoreIds}
        toggleEmployeeActive={state.toggleEmployeeActive}
        setDeleteTarget={state.setDeleteTarget}
        toggleEmployeeStore={state.toggleEmployeeStore}
        draftAuthEmployeePins={state.draftAuthEmployeePins}
        updateDraftEmployeePin={state.updateDraftEmployeePin}
        updateEmployeeMobile={state.updateEmployeeMobile}
        newEmployeeName={state.newEmployeeName}
        setNewEmployeeName={state.setNewEmployeeName}
        newEmployeeMobile={state.newEmployeeMobile}
        setNewEmployeeMobile={state.setNewEmployeeMobile}
        newEmployeeStoreIds={state.newEmployeeStoreIds}
        toggleNewEmployeeStore={state.toggleNewEmployeeStore}
        addStaff={state.addStaff}
        teamSaving={state.teamSaving}
        saveManagingTeam={state.saveManagingTeam}
        inviteApiContext={state.inviteApiContext}
      />
    );
  }
  if (section === "appearance") {
    return (
      <OwnerSettingsAppearanceSection
        {...common}
        draftNotebookTheme={state.draftNotebookTheme}
        setDraftNotebookTheme={state.setDraftNotebookTheme}
        notebookTheme={state.notebookTheme}
        themeDirty={state.themeDirty}
        setThemeDirty={state.setThemeDirty}
        setNotebookTheme={state.setNotebookTheme}
        showSettingsSaved={state.showSettingsSaved}
        settingsSuccess={state.settingsSuccess}
      />
    );
  }
  if (section === "subscription") {
    return (
      <OwnerSettingsSupportSection
        {...common}
        onOpenSupport={onOpenSupport}
        onOpenHelp={onOpenHelp}
        entitlements={state.entitlements}
        entitlementsLoading={state.entitlementsLoading}
        entitlementsError={state.entitlementsError}
        reloadEntitlements={state.reloadEntitlements}
        ownerProfile={state.ownerProfile}
      />
    );
  }
  if (section === "support") {
    return (
      <OwnerSettingsSupportSection
        {...common}
        onOpenSupport={onOpenSupport}
        onOpenHelp={onOpenHelp}
        entitlements={state.entitlements}
        entitlementsLoading={state.entitlementsLoading}
        entitlementsError={state.entitlementsError}
        reloadEntitlements={state.reloadEntitlements}
        ownerProfile={state.ownerProfile}
      />
    );
  }
  if (!embedded && (section === "home" || !section)) {
    return (
      <OwnerSettingsHomeSection
        {...common}
        ownerProfile={state.ownerProfile}
        activeStoredBusinesses={state.activeStoredBusinesses}
        visibleStaff={state.visibleStaff}
        notebookTheme={state.notebookTheme}
        onLogout={onLogout}
        entitlements={state.entitlements}
        entitlementsLoading={state.entitlementsLoading}
      />
    );
  }
  return (
    <OwnerSettingsHomeSection
      {...common}
      ownerProfile={state.ownerProfile}
      activeStoredBusinesses={state.activeStoredBusinesses}
      visibleStaff={state.visibleStaff}
      notebookTheme={state.notebookTheme}
      onLogout={onLogout}
      entitlements={state.entitlements}
      entitlementsLoading={state.entitlementsLoading}
    />
  );
}
