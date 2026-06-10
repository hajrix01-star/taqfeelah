"use client";

import { ActionRow, SettingToggle } from "./owner-settings-ui-primitives";
import { renderOwnerSettingsSection } from "./owner-settings-section-views";
import { renderOwnerSettingsStorePanel } from "./owner-settings-store-views";
import { useOwnerSettingsScreenState } from "./use-owner-settings-screen-state";

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
}) {
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
  });

  const viewState = { ...state, lang };

  if (state.settingsStoreId && state.selectedStore) {
    return renderOwnerSettingsStorePanel(state.storePanel, viewState);
  }

  return renderOwnerSettingsSection(state.section, viewState, {
    onLogout,
    onOpenSupport,
    onOpenHelp,
  });
}

export { OwnerSettingsScreen, SettingToggle, ActionRow };
