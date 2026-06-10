"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { resolveStoreChannelConfig } from "@/features/org-config/client/store-channel-config";
import { getStoreOperationalConfig } from "@/features/org-config/client/store-operational-config";
import {
  buildOwnerProfileUpdate,
  isOwnerAuthDirty,
  isOwnerProfileDirty,
  validateOwnerAuthCredentials,
} from "@/features/org-config/client/owner-settings-account-actions";
import {
  buildOwnerSettingsLocalStoragePayload,
  buildOwnerSettingsTeamPersistPayload,
  persistOwnerSettingsToLocalStorage,
} from "@/features/org-config/client/owner-settings-local-persistence";
import {
  applyPersistedStoreChannelSettings,
  applyPersistedStoreOperationalSettings,
  applyStoreProfileUpdate,
  buildArchiveStoreDeleteTarget,
  buildNewConfiguredBusiness,
  buildRemoveStoreDeleteTarget,
  partitionConfiguredBusinesses,
  toggleArchivedBusinessId,
} from "@/features/org-config/client/owner-settings-store-actions";
import { resolveStorePanelOpenDrafts } from "@/features/org-config/client/owner-settings-store-panel-actions";
import {
  addCustomSalesChannel,
  canRequestRetireSalesChannel,
  restoreRetiredSalesChannel,
  retireSalesChannelInDraft,
  toggleSalesChannelActive,
} from "@/features/org-config/client/owner-settings-channel-actions";
import {
  mergeOperationalDraft,
  toggleOperationalCategory,
} from "@/features/org-config/client/owner-settings-operational-actions";
import {
  buildNewStaffMember,
  canAddStaffMember,
  cloneStaffDraft,
  prepareSavedTeamDraft,
  resolveTeamSaveFailureMessage,
  toggleEmployeeActiveInDraft,
  toggleEmployeeStoreInDraft,
  toggleStoreSelection,
} from "@/features/org-config/client/owner-settings-team-actions";
import {
  applyOwnerSettingsDeleteTarget,
  listStaffWithoutActiveStoreAfterArchive,
  removeEmployeePinForPerson,
  storeHasOperationalRecords,
} from "@/features/org-config/client/owner-settings-delete-actions";
import {
  businessName,
  businessLocation,
  emptyStoreRecord,
  text,
  DEFAULT_STORE_CHANNEL_CONFIG,
} from "./prototype-runtime-demo-data";
import {
  APP_IN_PRODUCTION_MODE,
  PROTOTYPE_EMPLOYEE_PIN_DEFAULT,
  RUNTIME_SETTINGS_DB_SOURCE,
} from "./prototype-runtime-boot";

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
}) {
  const [section, setSection] = useState("home");
  const [settingsStoreId, setSettingsStoreId] = useState(null);
  const [storePanel, setStorePanel] = useState("overview");
  const [showAddStore, setShowAddStore] = useState(false);
  const [showArchivedStores, setShowArchivedStores] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const [draftStoreName, setDraftStoreName] = useState("");
  const [draftStoreLocation, setDraftStoreLocation] = useState("");
  const [draftStoreChannelConfig, setDraftStoreChannelConfig] = useState(null);
  const [draftStoreOperationalConfig, setDraftStoreOperationalConfig] = useState(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [draftNotebookTheme, setDraftNotebookTheme] = useState(notebookTheme);
  const [themeDirty, setThemeDirty] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [managingTeam, setManagingTeam] = useState(false);
  const [draftStaff, setDraftStaff] = useState(null);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeMobile, setNewEmployeeMobile] = useState("");
  const [newEmployeeStoreIds, setNewEmployeeStoreIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [settingsNotice, setSettingsNotice] = useState("");
  const [draftOwnerName, setDraftOwnerName] = useState(ownerProfile?.name || text(lang, "ownerName"));
  const [draftAuthOwnerUsername, setDraftAuthOwnerUsername] = useState(authOwnerUsername || "");
  const [draftAuthOwnerPassword, setDraftAuthOwnerPassword] = useState(authOwnerPassword || "");
  const [draftAuthEmployeePins, setDraftAuthEmployeePins] = useState(() => ({ ...(authEmployeePins || {}) }));
  const [teamSaving, setTeamSaving] = useState(false);

  const { active: activeStoredBusinesses, archived: archivedStoredBusinesses } = partitionConfiguredBusinesses(
    configuredBusinesses,
    archivedBusinessIds,
  );
  const selectedStore = configuredBusinesses.find((business) => business.id === settingsStoreId) || null;
  const archived = selectedStore ? archivedBusinessIds.includes(selectedStore.id) : false;
  const staffWorkingSet = managingTeam && draftStaff ? draftStaff : staff;
  const visibleStaff = staffWorkingSet.filter((person) => !person.removed);
  const employeeStoreIds = (person) => person.storeIds || ["shami"];
  const displayBusinessName = (business) => businessName(business, lang);
  const displayLocation = (business) => businessLocation(business, lang);
  const savedChannelConfig = resolveStoreChannelConfig(
    storeChannelSettings,
    settingsStoreId,
    DEFAULT_STORE_CHANNEL_CONFIG,
  );
  const savedOperationalConfig = getStoreOperationalConfig(storeOperationalSettings, settingsStoreId);
  const channelConfig = draftStoreChannelConfig || savedChannelConfig;
  const operationalConfig = draftStoreOperationalConfig || savedOperationalConfig;
  const visibleChannels = channelConfig.channels.filter((channel) => !channel.retired);
  const retiredChannels = channelConfig.channels.filter((channel) => channel.retired);
  const linkedStaff = selectedStore ? visibleStaff.filter((person) => employeeStoreIds(person).includes(selectedStore.id)) : [];
  const activeCategoryCount = operationalConfig.activeCategories.length;
  const activeChannelCount = channelConfig.activeIds.length;

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
  useEffect(() => { setDraftOwnerName(ownerProfile?.name || text(lang, "ownerName")); }, [ownerProfile?.name, lang]);
  useEffect(() => { setDraftAuthOwnerUsername(authOwnerUsername || ""); }, [authOwnerUsername]);
  useEffect(() => { setDraftAuthOwnerPassword(authOwnerPassword || ""); }, [authOwnerPassword]);
  useEffect(() => { setDraftAuthEmployeePins({ ...(authEmployeePins || {}) }); }, [authEmployeePins]);

  const showSettingsSaved = () => { setSettingsSuccess(true); window.setTimeout(() => setSettingsSuccess(false), 2200); };
  const saveOwnerProfile = () => {
    const nextProfile = buildOwnerProfileUpdate(ownerProfile, draftOwnerName);
    if (!nextProfile) return;
    setOwnerProfile(nextProfile);
    showSettingsSaved();
  };
  const saveAuthCredentials = () => {
    const credentials = validateOwnerAuthCredentials(draftAuthOwnerUsername, draftAuthOwnerPassword);
    if (!credentials.valid) {
      setSettingsNotice(lang === "ar" ? "اسم المستخدم وكلمة المرور للمالك مطلوبان." : "Owner username and password are required.");
      return;
    }
    setAuthOwnerUsername(credentials.username);
    setAuthOwnerPassword(credentials.password);
    setAuthEmployeePins(draftAuthEmployeePins || {});
    setSettingsNotice("");
    showSettingsSaved();
  };
  const resetStoreDrafts = () => { setDraftStoreName(""); setDraftStoreLocation(""); setDraftStoreChannelConfig(null); setDraftStoreOperationalConfig(null); setNewChannelName(""); setSettingsNotice(""); };
  const openStore = (id) => { resetStoreDrafts(); setSettingsStoreId(id); setStorePanel("overview"); };
  const closeStore = () => { resetStoreDrafts(); setSettingsStoreId(null); setStorePanel("overview"); };
  const openStorePanel = (panel) => {
    setSettingsNotice("");
    setStorePanel(panel);
    const drafts = resolveStorePanelOpenDrafts(panel, {
      selectedStore,
      displayBusinessName,
      displayLocation,
      savedChannelConfig,
      savedOperationalConfig,
    });
    if (drafts.profile) {
      setDraftStoreName(drafts.profile.name);
      setDraftStoreLocation(drafts.profile.location);
    }
    if (drafts.channelConfig) setDraftStoreChannelConfig(drafts.channelConfig);
    if (drafts.operationalConfig) setDraftStoreOperationalConfig(drafts.operationalConfig);
  };
  const backFromStorePanel = () => { resetStoreDrafts(); setStorePanel("overview"); };
  const saveStoreProfile = () => {
    if (!settingsStoreId || !draftStoreName.trim()) return;
    setConfiguredBusinesses((current) => applyStoreProfileUpdate(current, settingsStoreId, {
      name: draftStoreName,
      location: draftStoreLocation,
    }));
    showSettingsSaved(); backFromStorePanel();
  };
  const saveChannelSettings = () => {
    if (!settingsStoreId || !draftStoreChannelConfig) return;
    setStoreChannelSettings((current) => applyPersistedStoreChannelSettings(current, settingsStoreId, draftStoreChannelConfig));
    showSettingsSaved(); backFromStorePanel();
  };
  const saveOperationalSettings = () => {
    if (!settingsStoreId || !draftStoreOperationalConfig) return;
    setStoreOperationalSettings((current) => applyPersistedStoreOperationalSettings(current, settingsStoreId, draftStoreOperationalConfig));
    showSettingsSaved(); backFromStorePanel();
  };
  const updateOperationalDraft = (updates) => setDraftStoreOperationalConfig((current) => mergeOperationalDraft(current || savedOperationalConfig, updates));
  const updateChannelDraft = (updater) => setDraftStoreChannelConfig((current) => updater(current || savedChannelConfig));
  const toggleChannel = (id) => {
    const result = toggleSalesChannelActive(channelConfig, id);
    if (result.blocked) { setSettingsNotice(text(lang, "atLeastOneChannel")); return; }
    setSettingsNotice("");
    updateChannelDraft(() => result.config);
  };
  const requestRetireChannel = (channel) => {
    if (!canRequestRetireSalesChannel(channelConfig, channel)) { setSettingsNotice(text(lang, "atLeastOneChannel")); return; }
    setDeleteTarget({ type: "channel", item: channel });
  };
  const restoreSalesChannel = (channel) => updateChannelDraft((config) => restoreRetiredSalesChannel(config, channel));
  const addSalesChannel = () => {
    const result = addCustomSalesChannel(channelConfig, newChannelName, { icon: CreditCard });
    if (!result.added) return;
    setDraftStoreChannelConfig(result.config);
    setNewChannelName("");
  };
  const toggleCategory = (id) => {
    const result = toggleOperationalCategory(operationalConfig, id);
    if (result.blocked) { setSettingsNotice(text(lang, "atLeastOneCategory")); return; }
    setSettingsNotice("");
    setDraftStoreOperationalConfig(result.config);
  };
  const toggleArchive = (id) => setArchivedBusinessIds((current) => toggleArchivedBusinessId(current, id));
  const storeHasRecords = (business) => storeHasOperationalRecords(operationalEntries, business.id);
  const staffWithoutActiveStoreAfterArchive = (businessId) => listStaffWithoutActiveStoreAfterArchive({
    staff: visibleStaff,
    businessId,
    activeBusinessIds: activeStoredBusinesses.map((business) => business.id),
  });
  const requestArchiveStore = (business) => setDeleteTarget(
    buildArchiveStoreDeleteTarget(business, staffWithoutActiveStoreAfterArchive(business.id)),
  );
  const openStoreDelete = (business) => {
    const hasRecords = storeHasRecords(business);
    setDeleteTarget(buildRemoveStoreDeleteTarget(business, {
      hasRecords,
      affectedStaff: hasRecords ? staffWithoutActiveStoreAfterArchive(business.id) : [],
    }));
  };
  const addStore = () => {
    const business = buildNewConfiguredBusiness({
      name: newStoreName,
      location: newStoreLocation,
      emptyStoreRecord,
    });
    if (!business) return;
    setConfiguredBusinesses((current) => [...current, business]);
    setNewStoreName(""); setNewStoreLocation(""); setShowAddStore(false); showSettingsSaved();
  };
  const startManagingTeam = () => { setDraftStaff(cloneStaffDraft(staff)); setManagingTeam(true); };
  const cancelManagingTeam = () => { setDraftStaff(null); setManagingTeam(false); setNewEmployeeName(""); setNewEmployeeMobile(""); setNewEmployeeStoreIds([]); };
  const saveManagingTeam = async () => {
    if (!draftStaff || teamSaving) return;
    const { staff: nextStaff, employeePins: nextPins } = prepareSavedTeamDraft(draftStaff, {
      draftAuthEmployeePins,
      authEmployeePins,
      defaultPin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT || "1234",
    });
    setStaff(nextStaff);
    setAuthEmployeePins(nextPins);
    cancelManagingTeam();
    if (APP_IN_PRODUCTION_MODE && typeof onPersistSettingsNow === "function") {
      setTeamSaving(true);
      setSettingsNotice("");
      try {
        await onPersistSettingsNow(buildOwnerSettingsTeamPersistPayload({
          staff: nextStaff,
          authOwnerUsername,
          authOwnerPassword,
          authEmployeePins: nextPins,
        }));
        showSettingsSaved();
      } catch (failure) {
        setSettingsNotice(resolveTeamSaveFailureMessage(failure, lang));
      } finally {
        setTeamSaving(false);
      }
      return;
    }
    showSettingsSaved();
  };
  const addStaff = () => {
    if (!canAddStaffMember({ name: newEmployeeName, storeIds: newEmployeeStoreIds, managingTeam })) return;
    const created = buildNewStaffMember({
      name: newEmployeeName,
      mobile: newEmployeeMobile,
      storeIds: newEmployeeStoreIds,
      defaultPin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT,
    });
    setDraftStaff((current) => [...(current || staff), created.member]);
    setDraftAuthEmployeePins((current) => ({ ...(current || {}), ...created.employeePinsPatch }));
    setNewEmployeeName(""); setNewEmployeeMobile(""); setNewEmployeeStoreIds([]);
  };
  const updateDraftEmployeePin = (personId, value) => {
    setDraftAuthEmployeePins((current) => ({ ...(current || {}), [personId]: value }));
  };
  const toggleEmployeeActive = (personId) => {
    if (!managingTeam) return;
    setDraftStaff((current) => toggleEmployeeActiveInDraft(current || staff, personId));
  };
  const toggleEmployeeStore = (personId, storeId) => {
    if (!managingTeam) return;
    setDraftStaff((current) => toggleEmployeeStoreInDraft(current || staff, personId, storeId));
  };
  const toggleNewEmployeeStore = (storeId) => setNewEmployeeStoreIds((current) => toggleStoreSelection(current, storeId));
  const confirmDelete = () => {
    applyOwnerSettingsDeleteTarget({
      deleteTarget,
      selectedBusiness,
      apply: {
        appendArchivedBusinessId: (businessId) => {
          setArchivedBusinessIds((current) => (current.includes(businessId) ? current : [...current, businessId]));
        },
        removeConfiguredBusiness: (businessId) => {
          setConfiguredBusinesses((current) => current.filter((business) => business.id !== businessId));
        },
        removeArchivedBusinessId: (businessId) => {
          setArchivedBusinessIds((current) => current.filter((id) => id !== businessId));
        },
        removeStaffStoreId: (businessId) => {
          setStaff((current) => current.map((person) => ({
            ...person,
            storeIds: (person.storeIds || []).filter((id) => id !== businessId),
          })));
        },
        removeLastCloseoutDate: (businessId) => {
          setLastCloseoutDates((current) => {
            const next = { ...current };
            delete next[businessId];
            return next;
          });
        },
        setSelectedBusiness,
        clearArchivedReadOnlyBusinessId: () => setArchivedReadOnlyBusinessId(null),
        removeStoreChannelSettings: (businessId) => {
          setStoreChannelSettings((current) => {
            const next = { ...current };
            delete next[businessId];
            return next;
          });
        },
        removeStoreOperationalSettings: (businessId) => {
          setStoreOperationalSettings((current) => {
            const next = { ...current };
            delete next[businessId];
            return next;
          });
        },
        closeStore,
        retireChannel: (channel) => {
          updateChannelDraft((config) => retireSalesChannelInDraft(config, channel));
        },
        removeStaffMember: (personId) => {
          const removePerson = (current) => current.map((person) => (
            person.id === personId ? { ...person, active: false, removed: true } : person
          ));
          if (managingTeam) setDraftStaff((current) => removePerson(current || staff));
          else setStaff(removePerson);
        },
        removeEmployeePin: (personId) => {
          setDraftAuthEmployeePins((current) => removeEmployeePinForPerson(current, personId));
          setAuthEmployeePins((current) => removeEmployeePinForPerson(current, personId));
        },
      },
    });
    setDeleteTarget(null);
  };

  const deleteDialogProps = {
    lang,
    deleteTarget,
    onCancel: () => setDeleteTarget(null),
    onConfirm: confirmDelete,
    translate: (key) => text(lang, key),
  };

  const ownerProfileDirty = isOwnerProfileDirty(draftOwnerName, ownerProfile?.name);
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
    newChannelName,
    setNewChannelName,
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
    openStore,
    closeStore,
    openStorePanel,
    backFromStorePanel,
    saveStoreProfile,
    saveChannelSettings,
    saveOperationalSettings,
    updateOperationalDraft,
    toggleChannel,
    requestRetireChannel,
    restoreSalesChannel,
    addSalesChannel,
    toggleCategory,
    toggleArchive,
    requestArchiveStore,
    openStoreDelete,
    addStore,
    startManagingTeam,
    cancelManagingTeam,
    saveManagingTeam,
    addStaff,
    updateDraftEmployeePin,
    toggleEmployeeActive,
    toggleEmployeeStore,
    toggleNewEmployeeStore,
    saveOwnerProfile,
    saveAuthCredentials,
    showSettingsSaved,
    setNotebookTheme,
    notebookTheme,
    ownerProfile,
    setOwnerPage,
    setArchivedReadOnlyBusinessId,
    setSelectedBusiness,
  };
}
