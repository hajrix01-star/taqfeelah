"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildOwnerSettingsLocalStoragePayload,
  persistOwnerSettingsToLocalStorage,
} from "@/features/org-config/client/owner-settings-local-persistence";
import { resolveStoreChannelConfig } from "@/features/org-config/client/store-channel-config";
import { getStoreOperationalConfig } from "@/features/org-config/client/store-operational-config";
import {
  isOwnerAuthDirty,
  isOwnerProfileDirty,
} from "@/features/org-config/client/owner-settings-account-actions";
import { resolveStoreFlattenedOpenDrafts } from "@/features/org-config/client/owner-settings-store-panel-actions";
import { isFlattenedStoreSettingsEnabled } from "@/core/config/owner-settings-store-layout-mode";
import { partitionConfiguredBusinesses } from "@/features/org-config/client/owner-settings-store-actions";
import {
  businessName,
  businessLocation,
  text,
  DEFAULT_STORE_CHANNEL_CONFIG,
} from "./taqfeelah-app-demo-data";
import {
  APP_IN_PRODUCTION_MODE,
  RUNTIME_SETTINGS_DB_SOURCE,
} from "./taqfeelah-app-boot";
import { createOwnerSettingsScreenHandlers } from "./owner-settings-screen-action-handlers";
import { useOrganizationEntitlements } from "@/features/billing/client/use-organization-entitlements";
import { useOwnerAccountSummary } from "@/features/owner-account/client/use-owner-account-summary";
import { bindsToServerAuth } from "@/core/config/runtime-capabilities";
import { isOrgConfigApiEnabled } from "@/core/config/org-config-api-mode";
import type { UseOwnerSettingsScreenStateProps } from "./taqfeelah-app-types";
import type { StoreChannelConfig } from "@/features/org-config/client/org-config-client-types";
import type { StoreOperationalSettings } from "@/domain/store-operational-settings/types";
import type { StaffMember, OwnerSettingsDeleteTarget } from "@/features/org-config/client/org-config-client-types";
import type { PrototypeBusiness } from "./taqfeelah-app-types";

export function useOwnerSettingsScreenState({
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
  billingApiContext = null,
  orgConfigApiContext = null,
  initialSettingsSection = "home",
}: UseOwnerSettingsScreenStateProps) {
  const billingEnabled = Boolean(
    billingApiContext?.organizationId
    && billingApiContext?.actorUserId
    && (bindsToServerAuth() || isOrgConfigApiEnabled()),
  );
  const {
    entitlements,
    loading: entitlementsLoading,
    error: entitlementsError,
    reload: reloadEntitlements,
  } = useOrganizationEntitlements({
    enabled: billingEnabled,
    auth: billingApiContext || {},
  });
  const ownerAccountEnabled = Boolean(
    billingApiContext?.organizationId
    && billingApiContext?.actorUserId
    && bindsToServerAuth(),
  );
  const {
    account: ownerAccount,
    loading: ownerAccountLoading,
    error: ownerAccountError,
    reload: reloadOwnerAccount,
  } = useOwnerAccountSummary({
    enabled: ownerAccountEnabled,
    auth: billingApiContext || {},
    lang,
  });

  const [section, setSection] = useState(() => {
    if (initialSettingsSection === "home" || initialSettingsSection === "stores-team") return "stores";
    if (initialSettingsSection === "stores" || initialSettingsSection === "team" || initialSettingsSection === "subscription") {
      return initialSettingsSection;
    }
    return initialSettingsSection;
  });
  useEffect(() => {
    const normalized = initialSettingsSection === "home" || initialSettingsSection === "stores-team"
      ? "stores"
      : initialSettingsSection;
    setSection(normalized);
  }, [initialSettingsSection]);

  const [settingsStoreId, setSettingsStoreId] = useState<string | null>(null);
  const [storePanel, setStorePanel] = useState("overview");
  const [showAddStore, setShowAddStore] = useState(false);
  const [showArchivedStores, setShowArchivedStores] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const [draftStoreName, setDraftStoreName] = useState("");
  const [draftStoreLocation, setDraftStoreLocation] = useState("");
  const [draftStoreChannelConfig, setDraftStoreChannelConfig] = useState<StoreChannelConfig | null>(null);
  const [draftStoreOperationalConfig, setDraftStoreOperationalConfig] = useState<StoreOperationalSettings | null>(null);
  const [newCustomIncomeSourceName, setNewCustomIncomeSourceName] = useState("");
  const [draftNotebookTheme, setDraftNotebookTheme] = useState(notebookTheme);
  const [themeDirty, setThemeDirty] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [managingTeam, setManagingTeam] = useState(false);
  const [draftStaff, setDraftStaff] = useState<StaffMember[] | null>(null);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeMobile, setNewEmployeeMobile] = useState("");
  const [newEmployeeStoreIds, setNewEmployeeStoreIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<OwnerSettingsDeleteTarget | null>(null);
  const [settingsNotice, setSettingsNotice] = useState("");
  const [draftOwnerName, setDraftOwnerName] = useState(typeof ownerProfile?.name === "string" ? ownerProfile.name : "");
  const [draftAuthOwnerUsername, setDraftAuthOwnerUsername] = useState(authOwnerUsername || "");
  const [draftAuthOwnerPassword, setDraftAuthOwnerPassword] = useState(authOwnerPassword || "");
  const [draftAuthEmployeePins, setDraftAuthEmployeePins] = useState(() => ({ ...(authEmployeePins || {}) }));
  const [teamSaving, setTeamSaving] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);

  const { active: activeStoredBusinesses, archived: archivedStoredBusinesses } = partitionConfiguredBusinesses(
    configuredBusinesses,
    archivedBusinessIds,
  );
  const selectedStore = configuredBusinesses.find((business) => business.id === settingsStoreId) || null;
  const archived = selectedStore ? archivedBusinessIds.includes(selectedStore.id) : false;
  const staffWorkingSet = managingTeam && draftStaff ? draftStaff : staff;
  const visibleStaff = staffWorkingSet.filter((person: StaffMember) => !person.removed && !person.deleted && !person.deletedAt);
  const employeeStoreIds = (person: StaffMember) => (person.storeIds as string[] | undefined) || ["shami"];
  const displayBusinessName = useCallback((business: PrototypeBusiness) => businessName(business, lang), [lang]);
  const displayLocation = useCallback((business: PrototypeBusiness) => businessLocation(business, lang), [lang]);
  const savedChannelConfig = resolveStoreChannelConfig(
    storeChannelSettings,
    settingsStoreId || "",
    DEFAULT_STORE_CHANNEL_CONFIG,
  );
  const savedOperationalConfig = getStoreOperationalConfig(storeOperationalSettings, settingsStoreId || "");
  const channelConfig = draftStoreChannelConfig || savedChannelConfig;
  const operationalConfig = draftStoreOperationalConfig || savedOperationalConfig;
  const visibleChannels = channelConfig.channels.filter((channel) => !channel.retired);
  const retiredChannels = channelConfig.channels.filter((channel) => channel.retired);
  const linkedStaff = selectedStore ? visibleStaff.filter((person) => employeeStoreIds(person).includes(selectedStore.id)) : [];
  const activeCategoryCount = operationalConfig.activeCategories.length;
  const activeChannelCount = channelConfig.activeIds.length;

  useEffect(() => {
    if (!isFlattenedStoreSettingsEnabled() || !settingsStoreId) return;
    const store = configuredBusinesses.find((business) => business.id === settingsStoreId);
    if (!store) return;
    const channelConfigForStore = resolveStoreChannelConfig(
      storeChannelSettings,
      settingsStoreId,
      DEFAULT_STORE_CHANNEL_CONFIG,
    );
    const operationalConfigForStore = getStoreOperationalConfig(storeOperationalSettings, settingsStoreId);
    const drafts = resolveStoreFlattenedOpenDrafts({
      selectedStore: store,
      displayBusinessName: displayBusinessName as (store: Record<string, unknown>) => string,
      displayLocation: displayLocation as (store: Record<string, unknown>) => string,
      savedChannelConfig: channelConfigForStore,
      savedOperationalConfig: operationalConfigForStore,
    });
    setDraftStoreName(String(drafts.profile.name || ""));
    setDraftStoreLocation(String(drafts.profile.location || ""));
    setDraftStoreChannelConfig(drafts.channelConfig);
    setDraftStoreOperationalConfig(drafts.operationalConfig as StoreOperationalSettings);
    setNewCustomIncomeSourceName("");
    setSettingsNotice("");
    // Only re-init when switching stores; including settings deps would wipe unsaved edits.
  }, [settingsStoreId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    persistOwnerSettingsToLocalStorage(
      buildOwnerSettingsLocalStoragePayload({
        configuredBusinesses,
        archivedBusinessIds,
        storeChannelSettings,
        storeOperationalSettings,
        notebookTheme,
        employeePreferences,
        ownerShellPreferences,
        staff,
        ownerProfile,
        authOwnerUsername,
        authOwnerPassword,
        authEmployeePins,
      }),
      { enabled: !APP_IN_PRODUCTION_MODE && !RUNTIME_SETTINGS_DB_SOURCE },
    );
  }, [configuredBusinesses, archivedBusinessIds, employeePreferences, ownerShellPreferences, storeChannelSettings, storeOperationalSettings, notebookTheme, staff, ownerProfile, authOwnerUsername, authOwnerPassword, authEmployeePins]);
  useEffect(() => { setDraftNotebookTheme(notebookTheme); setThemeDirty(false); }, [notebookTheme]);
  useEffect(() => { setDraftOwnerName(typeof ownerProfile?.name === "string" ? ownerProfile.name : ""); }, [ownerProfile?.name]);
  useEffect(() => { setDraftAuthOwnerUsername(authOwnerUsername || ""); }, [authOwnerUsername]);
  useEffect(() => { setDraftAuthOwnerPassword(authOwnerPassword || ""); }, [authOwnerPassword]);
  useEffect(() => { setDraftAuthEmployeePins({ ...(authEmployeePins || {}) }); }, [authEmployeePins]);

  const showSettingsSaved = () => { setSettingsSuccess(true); window.setTimeout(() => setSettingsSuccess(false), 2200); };

  const handlers = useMemo(() => createOwnerSettingsScreenHandlers({
    lang,
    settingsStoreId,
    selectedStore,
    selectedBusiness,
    displayBusinessName,
    displayLocation,
    savedChannelConfig,
    savedOperationalConfig,
    channelConfig,
    operationalConfig,
    draftStaff,
    staff,
    managingTeam,
    teamSaving,
    newEmployeeName,
    newEmployeeMobile,
    newEmployeeStoreIds,
    draftOwnerName,
    draftAuthOwnerUsername,
    draftAuthOwnerPassword,
    draftAuthEmployeePins,
    authOwnerUsername,
    authOwnerPassword,
    authEmployeePins,
    ownerProfile,
    newStoreName,
    newStoreLocation,
    newCustomIncomeSourceName,
    draftStoreName,
    draftStoreLocation,
    draftStoreChannelConfig,
    draftStoreOperationalConfig,
    configuredBusinesses,
    storeChannelSettings,
    storeOperationalSettings,
    operationalEntries,
    activeStoredBusinesses,
    visibleStaff,
    deleteTarget,
    entitlements,
    reloadEntitlements,
    orgConfigApiContext,
    onPersistSettingsNow,
    showSettingsSaved,
    setters: {
      setOwnerProfile,
      setSettingsNotice,
      setDraftStoreName,
      setDraftStoreLocation,
      setDraftStoreChannelConfig,
      setDraftStoreOperationalConfig,
      setNewCustomIncomeSourceName,
      setSettingsStoreId,
      setStorePanel,
      setConfiguredBusinesses,
      setStoreChannelSettings,
      setStoreOperationalSettings,
      setArchivedBusinessIds,
      setDeleteTarget,
      setNewStoreName,
      setNewStoreLocation,
      setShowAddStore,
      setDraftStaff,
      setManagingTeam,
      setNewEmployeeName,
      setNewEmployeeMobile,
      setNewEmployeeStoreIds,
      setStaff,
      setAuthOwnerUsername,
      setAuthOwnerPassword,
      setAuthEmployeePins,
      setDraftAuthEmployeePins,
      setTeamSaving,
      setStoreSaving,
      setSelectedBusiness,
      setArchivedReadOnlyBusinessId,
      setLastCloseoutDates,
    },
  }), [
    lang,
    settingsStoreId,
    selectedStore,
    selectedBusiness,
    savedChannelConfig,
    savedOperationalConfig,
    channelConfig,
    operationalConfig,
    draftStaff,
    staff,
    managingTeam,
    teamSaving,
    newEmployeeName,
    newEmployeeMobile,
    newEmployeeStoreIds,
    draftOwnerName,
    draftAuthOwnerUsername,
    draftAuthOwnerPassword,
    draftAuthEmployeePins,
    authOwnerUsername,
    authOwnerPassword,
    authEmployeePins,
    ownerProfile,
    newStoreName,
    newStoreLocation,
    newCustomIncomeSourceName,
    draftStoreName,
    draftStoreLocation,
    draftStoreChannelConfig,
    draftStoreOperationalConfig,
    configuredBusinesses,
    storeChannelSettings,
    storeOperationalSettings,
    operationalEntries,
    activeStoredBusinesses,
    visibleStaff,
    deleteTarget,
    entitlements,
    reloadEntitlements,
    orgConfigApiContext,
    onPersistSettingsNow,
    displayBusinessName,
    displayLocation,
    setOwnerProfile,
    setStoreChannelSettings,
    setStoreOperationalSettings,
    setConfiguredBusinesses,
    setArchivedBusinessIds,
    setStaff,
    setAuthOwnerUsername,
    setAuthOwnerPassword,
    setAuthEmployeePins,
    setSelectedBusiness,
    setArchivedReadOnlyBusinessId,
    setLastCloseoutDates,
  ]);

  const deleteDialogProps = {
    lang,
    deleteTarget,
    onCancel: () => setDeleteTarget(null),
    onConfirm: handlers.confirmDelete,
    translate: (key: string) => text(lang, key),
  };

  const ownerProfileDirty = isOwnerProfileDirty(draftOwnerName, typeof ownerProfile?.name === "string" ? ownerProfile.name : "");
  const authDirty = isOwnerAuthDirty({
    draftUsername: draftAuthOwnerUsername,
    draftPassword: draftAuthOwnerPassword,
    currentUsername: authOwnerUsername || "",
    currentPassword: authOwnerPassword || "",
  });

  return {
    section,
    setSection,
    settingsStoreId,
    storePanel,
    showAddStore,
    setShowAddStore,
    showArchivedStores,
    setShowArchivedStores,
    newStoreName,
    setNewStoreName,
    newStoreLocation,
    setNewStoreLocation,
    draftStoreName,
    setDraftStoreName,
    draftStoreLocation,
    setDraftStoreLocation,
    newCustomIncomeSourceName,
    setNewCustomIncomeSourceName,
    draftNotebookTheme,
    setDraftNotebookTheme,
    themeDirty,
    setThemeDirty,
    settingsSuccess,
    managingTeam,
    newEmployeeName,
    setNewEmployeeName,
    newEmployeeMobile,
    setNewEmployeeMobile,
    newEmployeeStoreIds,
    teamSaving,
    storeSaving,
    settingsNotice,
    draftOwnerName,
    setDraftOwnerName,
    draftAuthOwnerUsername,
    setDraftAuthOwnerUsername,
    draftAuthOwnerPassword,
    setDraftAuthOwnerPassword,
    draftAuthEmployeePins,
    activeStoredBusinesses,
    archivedStoredBusinesses,
    selectedStore,
    archived,
    visibleStaff,
    employeeStoreIds,
    displayBusinessName,
    displayLocation,
    channelConfig,
    operationalConfig,
    visibleChannels,
    retiredChannels,
    linkedStaff,
    activeCategoryCount,
    activeChannelCount,
    deleteDialogProps,
    ownerProfileDirty,
    authDirty,
    setDeleteTarget,
    ...handlers,
    showSettingsSaved,
    setNotebookTheme,
    notebookTheme,
    ownerProfile,
    setOwnerPage,
    setArchivedReadOnlyBusinessId,
    setSelectedBusiness,
    entitlements,
    entitlementsLoading,
    entitlementsError,
    reloadEntitlements,
    ownerAccount,
    ownerAccountLoading,
    ownerAccountError,
    reloadOwnerAccount,
    serverAuthMode: bindsToServerAuth(),
    orgConfigApiContext,
  };
}
