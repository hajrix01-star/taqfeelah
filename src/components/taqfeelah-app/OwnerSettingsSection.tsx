"use client";

import { ActionRow, SettingToggle } from "./owner-settings-ui-primitives";
import { renderOwnerSettingsStorePanel, OwnerSettingsStoreFlattenedPanel } from "./owner-settings-store-views";
import { isFlattenedStoreSettingsEnabled } from "@/core/config/owner-settings-store-layout-mode";
import { useOwnerSettingsScreenState } from "./use-owner-settings-screen-state";
import { OwnerSettingsTabbedShell } from "./owner-settings-tabbed-shell";
import type { OwnerSettingsScreenProps, OwnerSettingsStoreFlattenedPanelProps } from "./taqfeelah-app-types";

function OwnerSettingsScreen({
  lang,
  notebookTheme,
  setNotebookTheme,
  employeePreferences = {},
  ownerShellPreferences = {},
  storeChannelSettings,
  setStoreChannelSettings,
  storeOperationalSettings,
  setStoreOperationalSettings,
  configuredBusinesses,
  setConfiguredBusinesses,
  archivedBusinessIds,
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
  operationalEntries = [],
  selectedBusiness,
  setSelectedBusiness,
  setOwnerPage,
  setArchivedReadOnlyBusinessId,
  setLastCloseoutDates,
  onPersistSettingsNow = null,
  onLogout = () => {},
  onOpenSupport = () => {},
  onOpenHelp = () => {},
  inviteApiContext = null,
  billingApiContext = null,
  orgConfigApiContext = null,
  initialSettingsSection = "home",
}: OwnerSettingsScreenProps) {
  const state = useOwnerSettingsScreenState({
    lang,
    notebookTheme,
    setNotebookTheme,
    employeePreferences,
    ownerShellPreferences,
    storeChannelSettings,
    setStoreChannelSettings,
    storeOperationalSettings,
    setStoreOperationalSettings,
    configuredBusinesses,
    setConfiguredBusinesses,
    archivedBusinessIds,
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
    operationalEntries,
    selectedBusiness,
    setSelectedBusiness,
    setOwnerPage,
    setArchivedReadOnlyBusinessId,
    setLastCloseoutDates,
    onPersistSettingsNow,
    billingApiContext,
    orgConfigApiContext,
    initialSettingsSection,
  });

  const viewState = { ...state, lang, inviteApiContext };

  if (state.settingsStoreId && state.selectedStore) {
    if (isFlattenedStoreSettingsEnabled()) {
      const flattenedProps = {
        ...viewState,
        selectedStore: state.selectedStore,
        archived: state.archived,
        activeChannelCount: state.activeChannelCount,
        activeCategoryCount: state.activeCategoryCount,
        operationalConfig: state.operationalConfig,
        linkedStaff: state.linkedStaff,
        visibleChannels: state.visibleChannels,
        channelConfig: state.channelConfig,
        retiredChannels: state.retiredChannels,
        notebookTheme: state.notebookTheme,
      } as unknown as OwnerSettingsStoreFlattenedPanelProps;

      return (
        <OwnerSettingsStoreFlattenedPanel
          {...flattenedProps}
        />
      );
    }
    return renderOwnerSettingsStorePanel(state.storePanel, viewState);
  }

  return (
    <OwnerSettingsTabbedShell
      state={viewState}
      callbacks={{ onLogout, onOpenSupport, onOpenHelp }}
    />
  );
}

export { OwnerSettingsScreen, SettingToggle, ActionRow };
