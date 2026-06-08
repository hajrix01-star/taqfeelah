"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Plus,
  ReceiptText,
  Smartphone,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { resolveStoreChannelConfig } from "@/features/org-config/client/store-channel-config";
import { getStoreOperationalConfig } from "@/features/org-config/client/store-operational-config";
import EmployeeHistoryVisibilityPicker from "@/features/employee-closeouts/EmployeeHistoryVisibilityPicker";
import { isNotebookThemeDirty } from "@/features/org-config/client/owner-settings-appearance-actions";
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
  buildStaffDeleteTarget,
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
import { buildOwnerSettingsDeleteDialog } from "@/features/org-config/client/owner-settings-delete-dialog";
import {
  businessName,
  businessLocation,
  channelName,
  emptyStoreRecord,
  expenseCategories,
  text,
} from "./prototype-runtime-demo-data";
import {
  APP_IN_PRODUCTION_MODE,
  PROTOTYPE_EMPLOYEE_PIN_DEFAULT,
  RUNTIME_SETTINGS_DB_SOURCE,
} from "./prototype-runtime-boot";
import { BackTitle } from "./prototype-runtime-chrome";
import { ThemePicker } from "./prototype-runtime-notebook";

function Badge({ children, tone = "neutral" }) {
  const themes = { neutral: "bg-[#F0ECE2] text-[#655B45]", success: "bg-[#E6F5E9] text-[#257844]", warning: "bg-[#FFF0E2] text-[#B96725]", navy: "bg-[#E7EEF5] text-[#112A46]" };
  return <span className={`rounded-full px-2.5 py-1 text-taq-meta font-bold ${themes[tone]}`}>{children}</span>;
}

function SettingToggle({ enabled, onToggle, disabled = false }) { return <button disabled={disabled} onClick={onToggle} className={`relative h-6 w-11 rounded-full transition ${disabled ? "cursor-not-allowed opacity-55" : ""} ${enabled ? "bg-[#39A160]" : "bg-[#D9D3C7]"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "left-1" : "left-6"}`} /></button>; }
function OwnerSettingsScreen({ lang, notebookTheme, setNotebookTheme, storeChannelSettings, setStoreChannelSettings, storeOperationalSettings, setStoreOperationalSettings, configuredBusinesses, setConfiguredBusinesses, archivedBusinessIds, setArchivedBusinessIds, staff, setStaff, ownerProfile, setOwnerProfile, authOwnerUsername, setAuthOwnerUsername, authOwnerPassword, setAuthOwnerPassword, authEmployeePins, setAuthEmployeePins, operationalEntries = [], selectedBusiness, setSelectedBusiness, setOwnerPage, setArchivedReadOnlyBusinessId, setLastCloseoutDates, onPersistSettingsNow = null, onLogout = () => {}, onOpenSupport = () => {}, onOpenHelp = () => {} }) {
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
  const savedChannelConfig = resolveStoreChannelConfig(storeChannelSettings, settingsStoreId);
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
        staff,
        ownerProfile,
        authOwnerUsername,
        authOwnerPassword,
        authEmployeePins,
      }),
      { enabled: !APP_IN_PRODUCTION_MODE && !RUNTIME_SETTINGS_DB_SOURCE },
    );
  }, [configuredBusinesses, archivedBusinessIds, storeChannelSettings, storeOperationalSettings, notebookTheme, staff, ownerProfile, authOwnerUsername, authOwnerPassword, authEmployeePins]);
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
  const deleteDialog = buildOwnerSettingsDeleteDialog(deleteTarget, (key) => text(lang, key));
  const DeleteDialog = () => <AnimatePresence>{deleteDialog && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#B44747]"><Trash2 className="h-5 w-5" /></div><button onClick={() => setDeleteTarget(null)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{deleteDialog.title}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{deleteDialog.desc}</p><div className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "safeDeleteNotice")}</div>{deleteTarget?.affectedStaff?.length > 0 && <div className="mt-3 rounded-2xl bg-[#FFF1EE] p-3 text-taq-meta font-bold leading-5 text-[#B44747]"><p>{text(lang, "archiveStaffWarning")}</p><p className="mt-1">{deleteTarget.affectedStaff.map((person) => lang === "ar" ? person.nameAr : person.nameEn).join(" · ")}</p></div>}<div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={() => setDeleteTarget(null)} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={confirmDelete} className="rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white">{deleteDialog.action}</button></div></motion.div></motion.div>}</AnimatePresence>;
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  const SettingsLink = ({ icon: Icon, title, desc = "", value = "", onClick, danger = false, border = true }) => <button onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-4 text-start ${border ? "border-b border-[#F0ECE2]" : ""}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${danger ? "bg-[#FFF1EE] text-[#B44747]" : "bg-[#F7F5EF] text-[#806528]"}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className={`block text-taq-body-sm font-black ${danger ? "text-[#B44747]" : "text-[#112A46]"}`}>{title}</span>{desc && <span className="mt-0.5 block truncate text-taq-meta font-bold text-[#827762]">{desc}</span>}</span>{value && <span className="shrink-0 text-taq-meta font-bold text-[#827762]">{value}</span>}<Arrow className={`h-4 w-4 shrink-0 ${danger ? "text-[#B44747]" : "text-[#B99844]"}`} /></button>;
  const PageHeader = ({ title, onBack }) => <BackTitle lang={lang} title={title} onBack={onBack} />;

  if (settingsStoreId && selectedStore) {
    if (storePanel === "profile") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "بيانات المحل" : "Shop details"} onBack={backFromStorePanel} /><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "shopName")}</p><input value={draftStoreName} onChange={(event) => setDraftStoreName(event.target.value)} maxLength={80} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" /><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "newStoreLocation")}</p><input value={draftStoreLocation} onChange={(event) => setDraftStoreLocation(event.target.value)} maxLength={100} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" /><p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "renameStoreHint")}</p><button disabled={!draftStoreName.trim()} onClick={saveStoreProfile} className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${draftStoreName.trim() ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{text(lang, "saveSettings")}</button></div><DeleteDialog /></motion.section>;
    if (storePanel === "channels") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "salesChannels")} onBack={backFromStorePanel} /><p className="mb-3 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "channelControlHint")}</p><div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{visibleChannels.map((channel, index) => <div key={channel.id} className={`flex items-center justify-between gap-3 px-4 py-4 ${index < visibleChannels.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><div className="min-w-0"><p className="text-xs font-black">{channelName(channel, lang)}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{channelConfig.activeIds.includes(channel.id) ? text(lang, "active") : text(lang, "stopChannel")}</p></div><div className="flex items-center gap-2"><SettingToggle enabled={channelConfig.activeIds.includes(channel.id)} onToggle={() => toggleChannel(channel.id)} /><button onClick={() => requestRetireChannel(channel)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#B44747]"><Trash2 className="h-3.5 w-3.5" /></button></div></div>)}</div><div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-3 text-xs font-black">{text(lang, "addChannel")}</p><div className="flex gap-2"><input value={newChannelName} onChange={(event) => setNewChannelName(event.target.value)} placeholder={text(lang, "newChannelName")} className="min-w-0 flex-1 rounded-2xl bg-[#F7F5EF] px-3 py-3 text-xs font-bold outline-none" /><button onClick={addSalesChannel} className="rounded-2xl bg-[#112A46] px-4 text-xs font-black text-white"><Plus className="h-4 w-4" /></button></div>{retiredChannels.length > 0 && <div className="mt-4 border-t border-[#F0ECE2] pt-4"><p className="mb-2 text-taq-meta font-bold text-[#827762]">{text(lang, "stoppedChannels")}</p>{retiredChannels.map((channel) => <button key={channel.id} onClick={() => restoreSalesChannel(channel)} className="mb-2 flex w-full items-center justify-between rounded-xl bg-[#F7F5EF] px-3 py-3 text-taq-meta font-black text-[#257844]"><span>{channelName(channel, lang)}</span><span>{text(lang, "restoreChannel")}</span></button>)}</div>}</div>{settingsNotice && <p className="mb-3 rounded-xl bg-[#FFF1EE] p-3 text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>}<div className="grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button><button onClick={saveChannelSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div><DeleteDialog /></motion.section>;
    if (storePanel === "expenses") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "outflowCategories")} onBack={backFromStorePanel} /><p className="mb-3 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{lang === "ar" ? "تظهر هذه البنود عند اختيار نوع العملية: مصروف. إيقاف البند لا يغير التقارير السابقة." : "These items appear only for Expense entries. Disabling an item does not change historical reports."}</p><div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{expenseCategories.map((item, index) => <div key={item.id} className={`flex items-center justify-between px-4 py-4 ${index < expenseCategories.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><p className="text-xs font-black">{text(lang, item.label)}</p><SettingToggle enabled={operationalConfig.activeCategories.includes(item.id)} onToggle={() => toggleCategory(item.id)} /></div>)}</div>{settingsNotice && <p className="mb-3 rounded-xl bg-[#FFF1EE] p-3 text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>}<p className="mb-4 text-taq-meta font-bold leading-5 text-[#827762]">{lang === "ar" ? "إضافة بنود مخصصة ستنفذ في النسخة الإنتاجية بعد بناء نموذج البيانات الموحد." : "Custom expense items will be implemented in the production build with the unified data model."}</p><div className="grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button><button onClick={saveOperationalSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div></motion.section>;
    if (storePanel === "review") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "مراجعة الصور والتنبيهات" : "Photo review & notifications"} onBack={backFromStorePanel} /><div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingRow border title={text(lang, "reviewWorkflow")} desc={text(lang, "reviewWorkflowDesc")} toggle={<SettingToggle enabled={operationalConfig.reviewEnabled} onToggle={() => updateOperationalDraft({ reviewEnabled: !operationalConfig.reviewEnabled })} />} /><SettingRow border title={lang === "ar" ? "مراجعة تقفيلات الموظفين" : "Employee closeout review"} desc={lang === "ar" ? "عند التفعيل يجب على المالك اعتماد أو إرجاع تقفيلة اليوم قبل اعتبارها نهائية. الافتراضي: معطّل." : "When enabled, owner must approve or return employee daily closeouts. Default: off."} toggle={<SettingToggle enabled={operationalConfig.closeoutReviewEnabled} onToggle={() => updateOperationalDraft({ closeoutReviewEnabled: !operationalConfig.closeoutReviewEnabled })} />} /><SettingRow border title={text(lang, "pendingAttachmentAlert")} desc={text(lang, "pendingAttachmentAlertDesc")} toggle={<SettingToggle disabled={!operationalConfig.reviewEnabled} enabled={operationalConfig.attachmentAlert} onToggle={() => updateOperationalDraft({ attachmentAlert: !operationalConfig.attachmentAlert })} />} /><SettingRow title={text(lang, "dailyCloseoutAlert")} desc={text(lang, "dailyCloseoutAlertPrototype")} toggle={<SettingToggle enabled={operationalConfig.closeoutAlert} onToggle={() => updateOperationalDraft({ closeoutAlert: !operationalConfig.closeoutAlert })} />} /></div><EmployeeHistoryVisibilityPicker lang={lang} value={operationalConfig.employeeHistoryVisibility || "all"} onChange={(next) => updateOperationalDraft({ employeeHistoryVisibility: next })} /><div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-2 text-xs font-black">{lang === "ar" ? "شكل دفتر هذا المحل" : "This store notebook theme"}</p><ThemePicker lang={lang} theme={operationalConfig.notebookTheme || notebookTheme} onChange={(nextTheme) => updateOperationalDraft({ notebookTheme: nextTheme })} /><p className="mt-3 text-taq-meta font-bold leading-5 text-[#806528]">{lang === "ar" ? "يُستخدم في واجهة الموظف لهذا المحل ما لم يغيّر الموظف لونه الشخصي." : "Used for this store's employee UI unless the employee picks a personal theme."}</p></div><div className="grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button><button onClick={saveOperationalSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div></motion.section>;
    if (storePanel === "staff") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "linkedEmployees")} onBack={backFromStorePanel} /><div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">{linkedStaff.length ? linkedStaff.map((person, index) => <div key={person.id} className={`flex items-center gap-3 py-3 ${index < linkedStaff.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><UserRound className="h-5 w-5 text-[#806528]" /><div><p className="text-xs font-black">{lang === "ar" ? person.nameAr : person.nameEn}</p><p dir="ltr" className="text-taq-meta text-[#827762]">{person.mobile}</p></div></div>) : <p className="text-xs font-bold text-[#827762]">{text(lang, "noLinkedEmployees")}</p>}</div><button onClick={() => { closeStore(); setSection("team"); }} className="w-full rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{lang === "ar" ? "إدارة الفريق والصلاحيات" : "Manage team access"}</button></motion.section>;
    return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "storeSettings")} onBack={closeStore} /><div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#112A46] text-[#E4B84A]"><Building2 className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{displayBusinessName(selectedStore)}</p><p className="mt-1 truncate text-taq-meta font-bold text-[#827762]">{displayLocation(selectedStore)}</p></div><Badge tone={archived ? "warning" : "success"}>{text(lang, archived ? "archivedStore" : "storeActive")}</Badge></div></div><div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Building2} title={lang === "ar" ? "بيانات المحل" : "Shop details"} desc={displayLocation(selectedStore)} onClick={() => openStorePanel("profile")} /><SettingsLink icon={CreditCard} title={text(lang, "salesChannels")} value={`${activeChannelCount}`} onClick={() => openStorePanel("channels")} /><SettingsLink icon={ReceiptText} title={text(lang, "outflowCategories")} value={`${activeCategoryCount}`} onClick={() => openStorePanel("expenses")} /><SettingsLink icon={Bell} title={lang === "ar" ? "مراجعة الصور والتنبيهات" : "Photo review & notifications"} value={operationalConfig.reviewEnabled ? text(lang, "active") : text(lang, "stopChannel")} onClick={() => openStorePanel("review")} /><SettingsLink icon={UserRound} title={text(lang, "linkedEmployees")} value={`${linkedStaff.length}`} onClick={() => openStorePanel("staff")} border={false} /></div>{archived && <div className="mb-5 rounded-3xl bg-[#FFF4D2] p-4"><Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge><p className="mt-3 text-taq-meta font-bold text-[#806528]">{text(lang, "archiveNotice")}</p><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => { setArchivedReadOnlyBusinessId(selectedStore.id); setSelectedBusiness(selectedStore.id); setOwnerPage("reports"); }} className="rounded-xl bg-white py-3 text-taq-meta font-black">{text(lang, "viewPastReports")}</button><button onClick={() => { setArchivedReadOnlyBusinessId(selectedStore.id); setSelectedBusiness(selectedStore.id); setOwnerPage("register"); }} className="rounded-xl bg-white py-3 text-taq-meta font-black">{text(lang, "viewPastAttachments")}</button></div></div>}<p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "الإدارة" : "Management"}</p>{archived ? <button onClick={() => toggleArchive(selectedStore.id)} className="w-full rounded-2xl bg-white py-3.5 text-xs font-black text-[#257844] ring-1 ring-black/[0.05]">{text(lang, "storeActive")}</button> : <div className="flex gap-3"><button onClick={() => requestArchiveStore(selectedStore)} className="flex-1 rounded-2xl bg-white py-3.5 text-xs font-black text-[#B96725] ring-1 ring-black/[0.05]">{text(lang, "archiveStore")}</button><button onClick={() => openStoreDelete(selectedStore)} className="flex-1 rounded-2xl bg-[#FFF1EE] py-3.5 text-xs font-black text-[#B44747]">{text(lang, "deleteStore")}</button></div>}{settingsSuccess && <div className="mt-4 rounded-2xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}<DeleteDialog /></motion.section>;
  }

  if (section === "account") {
    const ownerProfileDirty = isOwnerProfileDirty(draftOwnerName, ownerProfile?.name);
    const authDirty = isOwnerAuthDirty({
      draftUsername: draftAuthOwnerUsername,
      draftPassword: draftAuthOwnerPassword,
      currentUsername: authOwnerUsername || "",
      currentPassword: authOwnerPassword || "",
    });
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
        <PageHeader title={text(lang, "myAccountSecurity")} onBack={() => setSection("home")} />
        <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
          <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "ownerFullName")}</p>
          <input
            value={draftOwnerName}
            onChange={(event) => setDraftOwnerName(event.target.value)}
            maxLength={80}
            className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
          />
          <p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">
            {text(lang, "ownerRenameProfileHint")}
          </p>
          <button
            disabled={!ownerProfileDirty}
            onClick={saveOwnerProfile}
            className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${ownerProfileDirty ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}
          >
            {text(lang, "saveAccountSettings")}
          </button>
        </div>

        <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
          <p className="mb-2 text-xs font-bold text-[#716753]">
            {lang === "ar" ? "بيانات دخول المالك" : "Owner login credentials"}
          </p>
          <input
            dir="ltr"
            value={draftAuthOwnerUsername}
            onChange={(event) => setDraftAuthOwnerUsername(event.target.value)}
            placeholder={lang === "ar" ? "اسم المستخدم" : "Username"}
            className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
          />
          <input
            dir="ltr"
            type="password"
            value={draftAuthOwnerPassword}
            onChange={(event) => setDraftAuthOwnerPassword(event.target.value)}
            placeholder={lang === "ar" ? "كلمة المرور" : "Password"}
            className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
          />
          <p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">
            {lang === "ar"
              ? "يتم حفظها في إعدادات التشغيل على الخادم ويمكن تعديلها لاحقًا."
              : "Stored in server runtime settings and can be changed later."}
          </p>
          <button
            disabled={!authDirty && !ownerProfileDirty}
            onClick={saveAuthCredentials}
            className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${authDirty || ownerProfileDirty ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}
          >
            {lang === "ar" ? "حفظ بيانات الدخول" : "Save login credentials"}
          </button>
          {settingsNotice && <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>}
          {settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}
        </div>
      </motion.section>
    );
  }
  if (section === "stores") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "المحلات" : "Shops"} onBack={() => setSection("home")} /><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-[#716753]">{text(lang, "activeStores")}</p><button onClick={() => setShowAddStore(!showAddStore)} className="flex items-center gap-1 text-taq-meta font-black text-[#9A823E]"><Plus className="h-3.5 w-3.5" />{text(lang, "addStore")}</button></div>{showAddStore && <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><input value={newStoreName} onChange={(event) => setNewStoreName(event.target.value)} placeholder={text(lang, "newStoreName")} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" /><input value={newStoreLocation} onChange={(event) => setNewStoreLocation(event.target.value)} placeholder={text(lang, "newStoreLocation")} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" /><button onClick={addStore} className="w-full rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "confirmAddStore")}</button></div>}<div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{activeStoredBusinesses.length ? activeStoredBusinesses.map((business, index) => <button key={business.id} onClick={() => openStore(business.id)} className={`flex w-full items-center justify-between px-4 py-4 text-start ${index < activeStoredBusinesses.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><div><p className="text-xs font-black">{displayBusinessName(business)}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{displayLocation(business)} آ· <span className="text-[#257844]">{text(lang, "storeActive")}</span></p></div><Arrow className="h-4 w-4 text-[#B99844]" /></button>) : <p className="p-5 text-center text-xs font-bold text-[#827762]">{text(lang, "noActiveStores")}</p>}</div>{archivedStoredBusinesses.length > 0 && <><button onClick={() => setShowArchivedStores(!showArchivedStores)} className="mb-3 flex items-center gap-1 text-taq-meta font-black text-[#9A823E]">{text(lang, showArchivedStores ? "hideArchived" : "showArchived")} ({archivedStoredBusinesses.length})<ChevronDown className={`h-3.5 w-3.5 ${showArchivedStores ? "rotate-180" : ""}`} /></button>{showArchivedStores && <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{archivedStoredBusinesses.map((business) => <button key={business.id} onClick={() => openStore(business.id)} className="flex w-full items-center justify-between px-4 py-4 text-start opacity-70"><div><p className="text-xs font-black">{displayBusinessName(business)}</p><p className="mt-1 text-taq-meta font-bold text-[#B96725]">{text(lang, "archivedStore")}</p></div><Arrow className="h-4 w-4" /></button>)}</div>}</>}<DeleteDialog /></motion.section>;
  if (section === "team") {
    return (
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
        <PageHeader title={lang === "ar" ? "الفريق والصلاحيات" : "Team & access"} onBack={() => { cancelManagingTeam(); setSection("home"); }} />
        <div className="mb-3 flex items-center justify-between">
          <p className="text-taq-meta font-bold text-[#806528]">{text(lang, "employeeEntryOnly")}</p>
          <button onClick={() => managingTeam ? cancelManagingTeam() : startManagingTeam()} className="text-taq-meta font-black text-[#9A823E]">
            {text(lang, managingTeam ? "cancelChanges" : "configure")}
          </button>
        </div>
        <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
          {visibleStaff.map((person, index) => (
            <div key={person.id} className={`p-4 ${index < visibleStaff.length - 1 || managingTeam ? "border-b border-[#F0ECE2]" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black">{lang === "ar" ? person.nameAr : person.nameEn}</p>
                  <p className="mt-1 text-taq-meta font-bold text-[#827762]">
                    {person.active ? text(lang, "active") : text(lang, "stopChannel")} آ· {employeeStoreIds(person).length} {lang === "ar" ? "محل" : "shop(s)"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <SettingToggle disabled={!managingTeam} enabled={person.active} onToggle={() => toggleEmployeeActive(person.id)} />
                  {managingTeam && (
                    <button onClick={() => setDeleteTarget(buildStaffDeleteTarget(person))} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#B44747]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {managingTeam && (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeStoredBusinesses.map((business) => (
                      <button key={business.id} onClick={() => toggleEmployeeStore(person.id, business.id)} className={`rounded-full px-3 py-2 text-taq-meta font-bold ${employeeStoreIds(person).includes(business.id) ? "bg-[#112A46] text-white" : "bg-[#F0ECE2] text-[#827762]"}`}>
                        {displayBusinessName(business)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-black text-[#716753]">{lang === "ar" ? "الرقم السري للموظف" : "Employee PIN"}</p>
                    <input
                      dir="ltr"
                      value={draftAuthEmployeePins?.[person.id] || ""}
                      onChange={(event) => updateDraftEmployeePin(person.id, event.target.value)}
                      placeholder={lang === "ar" ? "PIN أو كلمة مرور قصيرة" : "PIN or short passcode"}
                      className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
          {managingTeam && (
            <div className="p-4">
              <p className="mb-3 text-xs font-black">{text(lang, "addEmployee")}</p>
              <input value={newEmployeeName} onChange={(event) => setNewEmployeeName(event.target.value)} placeholder={text(lang, "newEmployeeName")} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" />
              <input value={newEmployeeMobile} onChange={(event) => setNewEmployeeMobile(event.target.value)} placeholder={text(lang, "employeeMobile")} className="mb-3 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" />
              <div className="mb-3 flex flex-wrap gap-2">
                {activeStoredBusinesses.map((business) => (
                  <button key={business.id} onClick={() => toggleNewEmployeeStore(business.id)} className={`rounded-full px-3 py-2 text-taq-meta font-bold ${newEmployeeStoreIds.includes(business.id) ? "bg-[#112A46] text-white" : "bg-[#F0ECE2] text-[#827762]"}`}>
                    {displayBusinessName(business)}
                  </button>
                ))}
              </div>
              <button disabled={!newEmployeeName.trim() || !newEmployeeStoreIds.length} onClick={addStaff} className={`w-full rounded-2xl py-3 text-xs font-black text-white ${newEmployeeName.trim() && newEmployeeStoreIds.length ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>
                {text(lang, "addEmployee")}
              </button>
            </div>
          )}
        </div>
        {managingTeam && (
          <div className="grid grid-cols-[0.9fr_1.35fr] gap-3">
            <button onClick={cancelManagingTeam} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button>
            <button type="button" disabled={teamSaving} onClick={() => { void saveManagingTeam(); }} className={`rounded-2xl py-3.5 text-xs font-black text-white ${teamSaving ? "bg-[#B8C0B7]" : "bg-[#112A46]"}`}>{text(lang, "saveTeamChanges")}</button>
          </div>
        )}
        <DeleteDialog />
      </motion.section>
    );
  }
  if (section === "appearance") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "notebookAppearance")} onBack={() => setSection("home")} /><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-2 text-taq-meta font-bold text-[#827762]">{lang === "ar" ? "اختر شكل دفتر التقفيلة والتقارير وصور المشاركة." : "Choose the notebook style for closeouts, reports, and sharing."}</p><ThemePicker lang={lang} theme={draftNotebookTheme} onChange={(nextTheme) => { setDraftNotebookTheme(nextTheme); setThemeDirty(isNotebookThemeDirty(nextTheme, notebookTheme)); }} /><p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "autoSavedAccount")}</p>{themeDirty && <div className="mt-4 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={() => { setDraftNotebookTheme(notebookTheme); setThemeDirty(false); }} className="rounded-2xl bg-[#F7F5EF] py-3 text-xs font-black">{text(lang, "cancelChanges")}</button><button onClick={() => { setNotebookTheme(draftNotebookTheme); setThemeDirty(false); showSettingsSaved(); }} className="rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div>}{settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}</div></motion.section>;
  if (section === "subscription") return APP_IN_PRODUCTION_MODE ? <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "الخطة والاشتراك" : "Plan & subscription"} onBack={() => setSection("home")} /><div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]"><Badge tone="warning">{lang === "ar" ? "معطّل حاليًا" : "Disabled for now"}</Badge><p className="mt-4 text-taq-meta font-bold leading-6 text-[#716753]">{lang === "ar" ? "تم تعطيل SaaS في مرحلة الإطلاق الحالية. سيتم تفعيله لاحقًا دون التأثير على تشغيل المحلات." : "SaaS billing is disabled for the current launch phase and will be enabled later without affecting store operations."}</p></div></motion.section> : <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "الخطة والاشتراك" : "Plan & subscription"} onBack={() => setSection("home")} /><div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]"><Badge tone="navy">{text(lang, "currentPlan")}</Badge><h3 className="mt-4 text-lg font-black">{lang === "ar" ? "نسخة التطوير الحالية" : "Current development access"}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "monthlyPrice")}</p><div className="mt-5 rounded-2xl bg-[#FFF4D2] p-4 text-taq-meta font-bold leading-6 text-[#806528]">{lang === "ar" ? "سيتم ربط الاشتراك بالمنشأة وليس بالمحل، مع تحديد عدد المحلات والموظفين وميزات التصدير لاحقًا." : "Subscription will be tied to the organization, not an individual shop, with plan limits added later."}</div></div></motion.section>;
  if (section === "support") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "support")} onBack={() => setSection("home")} /><div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Smartphone} title={text(lang, "whatsappSupport")} onClick={onOpenSupport} border /><SettingsLink icon={FileText} title={text(lang, "helpCenter")} onClick={onOpenHelp} border={false} /></div></motion.section>;
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><div className="mb-5"><p className="text-xs font-bold text-[#8B8274]">{text(lang, "ownerAccount")}</p><h1 className="text-xl font-black">{text(lang, "settings")}</h1></div><button onClick={() => setSection("account")} className="mb-5 flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-start ring-1 ring-black/[0.045]"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#112A46] text-white"><UserRound className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="text-sm font-black">{ownerProfile?.name || text(lang, "ownerName")}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "myAccountSecurity")}</p></div><Arrow className="h-4 w-4 shrink-0 text-[#B99844]" /></button><p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "المنشأة" : "Organization"}</p><div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Building2} title={lang === "ar" ? "المحلات" : "Shops"} value={`${activeStoredBusinesses.length}`} onClick={() => setSection("stores")} /><SettingsLink icon={UserRound} title={lang === "ar" ? "الفريق والصلاحيات" : "Team & access"} value={`${visibleStaff.length}`} onClick={() => setSection("team")} />{APP_IN_PRODUCTION_MODE ? null : <SettingsLink icon={CreditCard} title={lang === "ar" ? "الخطة والاشتراك" : "Plan & subscription"} value={lang === "ar" ? "تجريبي" : "Trial"} onClick={() => setSection("subscription")} border={false} />}</div><p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "التفضيلات" : "Preferences"}</p><div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={ReceiptText} title={text(lang, "notebookAppearance")} value={text(lang, notebookTheme)} onClick={() => setSection("appearance")} border={false} /></div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "support")}</p><div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Smartphone} title={text(lang, "contactSupport")} onClick={() => setSection("support")} /><SettingsLink icon={UserRound} title={text(lang, "logout")} onClick={onLogout} danger border={false} /></div></motion.section>;
}

function SettingRow({ title, desc, toggle, border }) { return <div className={`flex items-center justify-between px-4 py-4 ${border ? "border-b border-[#F0ECE2]" : ""}`}><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-taq-meta text-[#827762]">{desc}</p></div>{toggle}</div>; }
function ActionRow({ label, lang, danger = false, border = false, onClick = () => {} }) { const Arrow = lang === "ar" ? ChevronLeft : ChevronRight; return <button type="button" onClick={onClick} className={`flex w-full items-center justify-between px-4 py-4 text-sm font-black ${border ? "border-b border-[#F0ECE2]" : ""} ${danger ? "text-[#B44747]" : "text-[#112A46]"}`}><span>{label}</span><Arrow className="h-4 w-4" /></button>; }

export { OwnerSettingsScreen, SettingToggle, ActionRow };
