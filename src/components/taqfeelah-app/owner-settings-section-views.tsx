"use client";

import React from "react";
import { OwnerSettingsAccountSection } from "./owner-settings-account-section";
import { OwnerSettingsAppearanceSection } from "./owner-settings-appearance-section";
import { OwnerSettingsHomeSection } from "./owner-settings-home-section";
import { OwnerSettingsStoresSection } from "./owner-settings-stores-section";
import { OwnerSettingsSupportSection } from "./owner-settings-support-section";
import { OwnerSettingsTeamSection } from "./owner-settings-team-section";
import { SettingsSectionFrame } from "./owner-settings-section-frame";
import {
  resolveSettingsOrgSubTabItem,
  SettingsOrgSubTabs,
  SettingsTabbedPanel,
} from "./owner-settings-tab-primitives";
import type {
  AppBusiness,
  OwnerSettingsApiContext,
  OwnerSettingsSectionCommonProps,
  OwnerSettingsSectionRenderOptions,
  OwnerSettingsTabbedShellCallbacks,
  OwnerSettingsViewState,
} from "./taqfeelah-app-types";
import type { StaffMember } from "@/features/org-config/client/org-config-client-types";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/client/billing-client-types";

type OwnerSettingsStoresTeamSectionProps = OwnerSettingsSectionCommonProps & {
  section: string;
  visibleStaff: StaffMember[];
  employeeStoreIds: (person: StaffMember) => string[];
  activeStoredBusinesses: AppBusiness[];
  showAddStore: boolean;
  setShowAddStore: (value: boolean) => void;
  newStoreName: string;
  setNewStoreName: (value: string) => void;
  newStoreLocation: string;
  setNewStoreLocation: (value: string) => void;
  addStore: () => void | Promise<void>;
  archivedStoredBusinesses: AppBusiness[];
  showArchivedStores: boolean;
  setShowArchivedStores: (value: boolean) => void;
  displayBusinessName: (business: AppBusiness) => string;
  displayLocation: (business: AppBusiness) => string;
  openStore: (storeId: string) => void;
  deleteDialogProps: OwnerSettingsViewState["deleteDialogProps"];
  orgConfigLoading?: boolean;
  storeSaving: boolean;
  settingsNotice: string;
  settingsSuccess: boolean;
  entitlements: ResolvedOrganizationEntitlements | null;
  managingTeam: boolean;
  startManagingTeam: () => void;
  cancelManagingTeam: () => void;
  toggleEmployeeActive: (personId: string) => void;
  setDeleteTarget: OwnerSettingsViewState["setDeleteTarget"];
  toggleEmployeeStore: (personId: string, storeId: string) => void;
  draftAuthEmployeePins: Record<string, string>;
  updateDraftEmployeePin: (personId: string, pin: string) => void;
  updateEmployeeMobile: (personId: string, mobile: string) => void;
  newEmployeeName: string;
  setNewEmployeeName: (value: string) => void;
  newEmployeeMobile: string;
  setNewEmployeeMobile: (value: string) => void;
  newEmployeeStoreIds: string[];
  toggleNewEmployeeStore: (storeId: string) => void;
  addStaff: () => void;
  teamSaving: boolean;
  saveManagingTeam: () => void | Promise<void>;
  inviteApiContext?: OwnerSettingsApiContext;
};

export function OwnerSettingsStoresTeamSection(props: OwnerSettingsStoresTeamSectionProps) {
  const {
    section,
    setSection,
    visibleStaff,
    employeeStoreIds,
    activeStoredBusinesses,
    embedded = true,
  } = props;

  const sectionSubTab = section === "team" ? section : "stores";
  const [activeSubTab, setActiveSubTab] = React.useState(sectionSubTab);
  React.useEffect(() => {
    setActiveSubTab(sectionSubTab);
  }, [sectionSubTab]);
  const counts = {
    stores: activeStoredBusinesses?.length || 0,
    team: visibleStaff?.length || 0,
  };
  const tabItem = resolveSettingsOrgSubTabItem(props.lang, counts, activeSubTab);

  const countEmployeesForStore = React.useCallback((storeId: string) => (
    (visibleStaff as StaffMember[]).filter((person) => (employeeStoreIds as (person: StaffMember) => string[])(person).includes(storeId)).length
  ), [visibleStaff, employeeStoreIds]);

  return (
    <SettingsSectionFrame embedded={embedded}>
      <SettingsTabbedPanel
        sticky={false}
        surfaceClass={tabItem.contentSurfaceClass}
        accentClass={tabItem.contentAccentClass}
        tabs={(
          <SettingsOrgSubTabs
            lang={props.lang}
            value={activeSubTab}
            onChange={(next) => {
              setActiveSubTab(next);
              setSection(next);
            }}
            counts={counts}
            ariaLabel={props.lang === "ar" ? "المحلات والفريق" : "Shops and team"}
            integrated
          />
        )}
      >
        {activeSubTab === "stores" ? (
          <OwnerSettingsStoresSection
            {...props as React.ComponentProps<typeof OwnerSettingsStoresSection>}
            embedded
            countEmployeesForStore={countEmployeesForStore}
          />
        ) : null}
        {activeSubTab === "team" ? (
          <OwnerSettingsTeamSection
            {...props as React.ComponentProps<typeof OwnerSettingsTeamSection>}
            embedded
          />
        ) : null}
      </SettingsTabbedPanel>
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
        section={section}
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
        draftNotebookPattern={state.draftNotebookPattern}
        setDraftNotebookPattern={state.setDraftNotebookPattern}
        notebookPattern={state.notebookPattern}
        themeDirty={state.themeDirty}
        setThemeDirty={state.setThemeDirty}
        setNotebookTheme={state.setNotebookTheme}
        setNotebookPattern={state.setNotebookPattern}
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
        ownerProfile={state.ownerProfile as Record<string, unknown>}
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
        ownerProfile={state.ownerProfile as Record<string, unknown>}
      />
    );
  }
  if (!embedded && (section === "home" || !section)) {
    return (
      <OwnerSettingsHomeSection
        {...common}
        ownerProfile={state.ownerProfile as Record<string, unknown>}
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
      ownerProfile={state.ownerProfile as Record<string, unknown>}
      activeStoredBusinesses={state.activeStoredBusinesses}
      visibleStaff={state.visibleStaff}
      notebookTheme={state.notebookTheme}
      onLogout={onLogout}
      entitlements={state.entitlements}
      entitlementsLoading={state.entitlementsLoading}
    />
  );
}
