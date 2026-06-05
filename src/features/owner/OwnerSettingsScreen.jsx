"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2, UserRound, X } from "lucide-react";
import { text } from "@/i18n/text";
import { useSavedNotice } from "@/hooks/useSavedNotice";
import ThemePicker from "@/features/daily-closeouts/ThemePicker";
import EmployeeHistoryVisibilityPicker from "@/features/employee-closeouts/EmployeeHistoryVisibilityPicker";
import { Badge } from "@/features/daily-closeouts/NotebookAtoms";
import { businessName, businessLocation, channelName, channels, expenseCategories, money } from "@/utils/display-helpers";
import { getStoreChannelConfig, getStoreOperationalConfig } from "@/features/owner/store-config-helpers";
import { isProductionAppMode } from "@/core/config/app-mode";

const APP_IN_PRODUCTION_MODE = isProductionAppMode();
const PROTOTYPE_EMPLOYEE_PIN_DEFAULT = process.env.NEXT_PUBLIC_DEMO_EMPLOYEE_PIN_DEFAULT || (APP_IN_PRODUCTION_MODE ? "" : "1234");

function SettingRow({ title, desc, toggle, border }) { return <div className={`flex items-center justify-between px-4 py-4 ${border ? "border-b border-[#F0ECE2]" : ""}`}><div className="min-w-0 flex-1 pr-3"><p className="text-xs font-black text-[#112A46]">{title}</p>{desc && <p className="mt-0.5 text-taq-meta font-bold text-[#827762]">{desc}</p>}</div>{toggle}</div>; }
function SettingToggle({ enabled, onToggle, disabled = false }) { return <button disabled={disabled} onClick={onToggle} type="button" className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${enabled ? "bg-[#39A160]" : "bg-[#D9D1C1]"} ${disabled ? "opacity-40" : ""}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1"}`} /></button>; }
function BackTitle({ title, onBack, lang, inNotebook = false }) {
  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  return <div className={`mb-5 flex items-center gap-3 ${inNotebook ? "" : "px-5"}`}><button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0ECE2]"><BackIcon className="h-5 w-5" /></button><h2 className="text-base font-black">{title}</h2></div>;
}

export default function OwnerSettingsScreen({ lang, notebookTheme, setNotebookTheme, storeChannelSettings, setStoreChannelSettings, storeOperationalSettings, setStoreOperationalSettings, configuredBusinesses, setConfiguredBusinesses, archivedBusinessIds, setArchivedBusinessIds, staff, setStaff, ownerProfile, setOwnerProfile, authOwnerUsername, setAuthOwnerUsername, authOwnerPassword, setAuthOwnerPassword, authEmployeePins, setAuthEmployeePins, operationalEntries = [], selectedBusiness, setSelectedBusiness, setOwnerPage, setArchivedReadOnlyBusinessId, setLastCloseoutDates, onPersistSettingsNow = null, onLogout = () => {}, onOpenSupport = () => {}, onOpenHelp = () => {} }) {
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

  const activeStoredBusinesses = configuredBusinesses.filter((business) => !archivedBusinessIds.includes(business.id));
  const archivedStoredBusinesses = configuredBusinesses.filter((business) => archivedBusinessIds.includes(business.id));
  const selectedStore = configuredBusinesses.find((business) => business.id === settingsStoreId) || null;
  const archived = selectedStore ? archivedBusinessIds.includes(selectedStore.id) : false;
  const staffWorkingSet = managingTeam && draftStaff ? draftStaff : staff;
  const visibleStaff = staffWorkingSet.filter((person) => !person.removed);
  const employeeStoreIds = (person) => person.storeIds || ["shami"];
  const displayBusinessName = (business) => businessName(business, lang);
  const displayLocation = (business) => businessLocation(business, lang);
  const savedChannelConfig = getStoreChannelConfig(storeChannelSettings, settingsStoreId);
  const savedOperationalConfig = getStoreOperationalConfig(storeOperationalSettings, settingsStoreId);
  const channelConfig = draftStoreChannelConfig || savedChannelConfig;
  const operationalConfig = draftStoreOperationalConfig || savedOperationalConfig;
  const visibleChannels = channelConfig.channels.filter((channel) => !channel.retired);
  const retiredChannels = channelConfig.channels.filter((channel) => channel.retired);
  const linkedStaff = selectedStore ? visibleStaff.filter((person) => employeeStoreIds(person).includes(selectedStore.id)) : [];
  const activeCategoryCount = operationalConfig.activeCategories.length;
  const activeChannelCount = channelConfig.activeIds.length;

  useEffect(() => {
    if (APP_IN_PRODUCTION_MODE) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem("taqfeelah_owner_settings", JSON.stringify({
      configuredBusinesses,
      archivedBusinessIds,
      storeChannelSettings,
      storeOperationalSettings,
      notebookTheme,
      staff,
      ownerProfile,
      authConfig: {
        ownerUsername: authOwnerUsername,
        ownerPassword: authOwnerPassword,
        employeePins: authEmployeePins,
      },
    }));
  }, [configuredBusinesses, archivedBusinessIds, storeChannelSettings, storeOperationalSettings, notebookTheme, staff, ownerProfile, authOwnerUsername, authOwnerPassword, authEmployeePins]);
  useEffect(() => { setDraftNotebookTheme(notebookTheme); setThemeDirty(false); }, [notebookTheme]);
  useEffect(() => { setDraftOwnerName(ownerProfile?.name || text(lang, "ownerName")); }, [ownerProfile?.name, lang]);
  useEffect(() => { setDraftAuthOwnerUsername(authOwnerUsername || ""); }, [authOwnerUsername]);
  useEffect(() => { setDraftAuthOwnerPassword(authOwnerPassword || ""); }, [authOwnerPassword]);
  useEffect(() => { setDraftAuthEmployeePins({ ...(authEmployeePins || {}) }); }, [authEmployeePins]);

  const [settingsSuccess, showSettingsSaved] = useSavedNotice();
  const saveOwnerProfile = () => {
    const name = draftOwnerName.trim();
    if (!name) return;
    setOwnerProfile({ ...ownerProfile, name });
    showSettingsSaved();
  };
  const saveAuthCredentials = () => {
    const ownerUsername = draftAuthOwnerUsername.trim();
    const ownerPassword = draftAuthOwnerPassword.trim();
    if (!ownerUsername || !ownerPassword) {
      setSettingsNotice(lang === "ar" ? "اسم المستخدم وكلمة المرور للمالك مطلوبان." : "Owner username and password are required.");
      return;
    }
    setAuthOwnerUsername(ownerUsername);
    setAuthOwnerPassword(ownerPassword);
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
    if (panel === "profile") {
      setDraftStoreName(selectedStore?.displayName || displayBusinessName(selectedStore));
      setDraftStoreLocation(displayLocation(selectedStore));
    }
    if (panel === "channels") setDraftStoreChannelConfig({ ...savedChannelConfig, channels: savedChannelConfig.channels.map((channel) => ({ ...channel })), activeIds: [...savedChannelConfig.activeIds] });
    if (panel === "expenses" || panel === "review") setDraftStoreOperationalConfig({ ...savedOperationalConfig, activeCategories: [...savedOperationalConfig.activeCategories] });
  };
  const backFromStorePanel = () => { resetStoreDrafts(); setStorePanel("overview"); };
  const saveStoreProfile = () => {
    const name = draftStoreName.trim();
    if (!settingsStoreId || !name) return;
    setConfiguredBusinesses((current) => current.map((business) => business.id === settingsStoreId ? { ...business, displayName: name, customLocation: draftStoreLocation.trim() } : business));
    showSettingsSaved(); backFromStorePanel();
  };
  const saveChannelSettings = () => {
    if (!settingsStoreId || !draftStoreChannelConfig) return;
    setStoreChannelSettings((current) => ({ ...current, [settingsStoreId]: draftStoreChannelConfig }));
    showSettingsSaved(); backFromStorePanel();
  };
  const saveOperationalSettings = () => {
    if (!settingsStoreId || !draftStoreOperationalConfig) return;
    setStoreOperationalSettings((current) => ({ ...current, [settingsStoreId]: draftStoreOperationalConfig }));
    showSettingsSaved(); backFromStorePanel();
  };
  const updateOperationalDraft = (updates) => setDraftStoreOperationalConfig((current) => ({ ...(current || savedOperationalConfig), ...updates }));
  const updateChannelDraft = (updater) => setDraftStoreChannelConfig((current) => updater(current || savedChannelConfig));
  const toggleChannel = (id) => {
    if (channelConfig.activeIds.includes(id) && channelConfig.activeIds.length === 1) { setSettingsNotice(text(lang, "atLeastOneChannel")); return; }
    setSettingsNotice("");
    updateChannelDraft((config) => ({ ...config, activeIds: config.activeIds.includes(id) ? config.activeIds.filter((item) => item !== id) : [...config.activeIds, id] }));
  };
  const requestRetireChannel = (channel) => {
    if (channelConfig.activeIds.includes(channel.id) && channelConfig.activeIds.length === 1) { setSettingsNotice(text(lang, "atLeastOneChannel")); return; }
    setDeleteTarget({ type: "channel", item: channel });
  };
  const restoreSalesChannel = (channel) => updateChannelDraft((config) => ({ channels: config.channels.map((item) => item.id === channel.id ? { ...item, retired: false } : item), activeIds: config.activeIds.includes(channel.id) ? config.activeIds : [...config.activeIds, channel.id] }));
  const addSalesChannel = () => {
    const name = newChannelName.trim();
    if (!name) return;
    const id = `channel-${Date.now()}`;
    updateChannelDraft((config) => ({ channels: [...config.channels, { id, custom: true, nameAr: name, nameEn: name, icon: CreditCard }], activeIds: [...config.activeIds, id] }));
    setNewChannelName("");
  };
  const toggleCategory = (id) => {
    if (operationalConfig.activeCategories.includes(id) && operationalConfig.activeCategories.length === 1) { setSettingsNotice(text(lang, "atLeastOneCategory")); return; }
    setSettingsNotice("");
    updateOperationalDraft({ activeCategories: operationalConfig.activeCategories.includes(id) ? operationalConfig.activeCategories.filter((item) => item !== id) : [...operationalConfig.activeCategories, id] });
  };
  const toggleArchive = (id) => setArchivedBusinessIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const storeHasRecords = (business) => operationalEntries.some((entry) => entry.businessId === business.id);
  const staffWithoutActiveStoreAfterArchive = (businessId) => visibleStaff.filter((person) => person.active && employeeStoreIds(person).includes(businessId) && !employeeStoreIds(person).some((id) => id !== businessId && activeStoredBusinesses.some((business) => business.id === id)));
  const requestArchiveStore = (business) => setDeleteTarget({ type: "archive", item: business, affectedStaff: staffWithoutActiveStoreAfterArchive(business.id) });
  const openStoreDelete = (business) => { const hasRecords = storeHasRecords(business); setDeleteTarget({ type: "store", item: business, hasRecords, affectedStaff: hasRecords ? staffWithoutActiveStoreAfterArchive(business.id) : [] }); };
  const addStore = () => {
    if (!newStoreName.trim()) return;
    const id = `custom-${Date.now()}`;
    setConfiguredBusinesses((current) => [...current, { id, nameAr: newStoreName.trim(), nameEn: newStoreName.trim(), customLocation: newStoreLocation.trim(), day: { ...emptyStoreRecord }, month: { ...emptyStoreRecord } }]);
    setNewStoreName(""); setNewStoreLocation(""); setShowAddStore(false); showSettingsSaved();
  };
  const startManagingTeam = () => { setDraftStaff(staff.map((person) => ({ ...person, storeIds: [...(person.storeIds || [])] }))); setManagingTeam(true); };
  const cancelManagingTeam = () => { setDraftStaff(null); setManagingTeam(false); setNewEmployeeName(""); setNewEmployeeMobile(""); setNewEmployeeStoreIds([]); };
  const saveManagingTeam = async () => {
    if (!draftStaff || teamSaving) return;
    const nextStaff = draftStaff.map((person) => ({
      ...person,
      pin: draftAuthEmployeePins?.[person.id] || person.pin || "1234",
    }));
    const allowedIds = new Set(nextStaff.map((person) => person.id));
    const nextPins = Object.fromEntries(
      Object.entries({ ...(authEmployeePins || {}), ...(draftAuthEmployeePins || {}) })
        .filter(([personId]) => allowedIds.has(personId)),
    );
    setStaff(nextStaff);
    setAuthEmployeePins(nextPins);
    cancelManagingTeam();
    if (APP_IN_PRODUCTION_MODE && typeof onPersistSettingsNow === "function") {
      setTeamSaving(true);
      setSettingsNotice("");
      try {
        await onPersistSettingsNow({
          staff: nextStaff,
          authConfig: {
            ownerUsername: authOwnerUsername,
            ownerPassword: authOwnerPassword,
            employeePins: nextPins,
          },
        });
        showSettingsSaved();
      } catch (failure) {
        setSettingsNotice(
          failure instanceof Error && failure.message
            ? failure.message
            : (lang === "ar" ? "تعذر حفظ الفريق على الخادم." : "Failed to save team on server."),
        );
      } finally {
        setTeamSaving(false);
      }
      return;
    }
    showSettingsSaved();
  };
  const addStaff = () => {
    if (!newEmployeeName.trim() || newEmployeeStoreIds.length === 0 || !managingTeam) return;
    const newStaffId = `staff-${Date.now()}`;
    setDraftStaff((current) => [...(current || staff), { id: newStaffId, nameAr: newEmployeeName.trim(), nameEn: newEmployeeName.trim(), mobile: newEmployeeMobile.trim(), active: true, storeIds: newEmployeeStoreIds, pin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT }]);
    setDraftAuthEmployeePins((current) => ({ ...(current || {}), [newStaffId]: PROTOTYPE_EMPLOYEE_PIN_DEFAULT || "1234" }));
    setNewEmployeeName(""); setNewEmployeeMobile(""); setNewEmployeeStoreIds([]);
  };
  const updateDraftEmployeePin = (personId, value) => {
    setDraftAuthEmployeePins((current) => ({ ...(current || {}), [personId]: value }));
  };
  const toggleEmployeeActive = (personId) => { if (managingTeam) setDraftStaff((current) => (current || staff).map((person) => person.id === personId ? { ...person, active: !person.active } : person)); };
  const toggleEmployeeStore = (personId, storeId) => { if (!managingTeam) return; setDraftStaff((current) => (current || staff).map((person) => { if (person.id !== personId) return person; const assigned = employeeStoreIds(person); const next = assigned.includes(storeId) ? assigned.filter((item) => item !== storeId) : [...assigned, storeId]; return { ...person, storeIds: next.length ? next : assigned }; })); };
  const toggleNewEmployeeStore = (storeId) => setNewEmployeeStoreIds((current) => current.includes(storeId) ? current.filter((item) => item !== storeId) : [...current, storeId]);
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "archive") { setArchivedBusinessIds((current) => current.includes(deleteTarget.item.id) ? current : [...current, deleteTarget.item.id]); closeStore(); }
    if (deleteTarget.type === "store") {
      if (deleteTarget.hasRecords) setArchivedBusinessIds((current) => current.includes(deleteTarget.item.id) ? current : [...current, deleteTarget.item.id]);
      else {
        setConfiguredBusinesses((current) => current.filter((business) => business.id !== deleteTarget.item.id));
        setArchivedBusinessIds((current) => current.filter((id) => id !== deleteTarget.item.id));
        setStaff((current) => current.map((person) => ({ ...person, storeIds: (person.storeIds || []).filter((id) => id !== deleteTarget.item.id) })));
        setLastCloseoutDates((current) => { const next = { ...current }; delete next[deleteTarget.item.id]; return next; });
        if (selectedBusiness === deleteTarget.item.id) setSelectedBusiness("all");
        setArchivedReadOnlyBusinessId(null);
        setStoreChannelSettings((current) => { const next = { ...current }; delete next[deleteTarget.item.id]; return next; });
        setStoreOperationalSettings((current) => { const next = { ...current }; delete next[deleteTarget.item.id]; return next; });
      }
      closeStore();
    }
    if (deleteTarget.type === "channel") updateChannelDraft((config) => ({ activeIds: config.activeIds.filter((id) => id !== deleteTarget.item.id), channels: config.channels.map((channel) => channel.id === deleteTarget.item.id ? { ...channel, retired: true } : channel) }));
    if (deleteTarget.type === "staff") {
      const removePerson = (current) => current.map((person) => person.id === deleteTarget.item.id ? { ...person, active: false, removed: true } : person);
      if (managingTeam) setDraftStaff((current) => removePerson(current || staff)); else setStaff(removePerson);
      setDraftAuthEmployeePins((current) => {
        const next = { ...(current || {}) };
        delete next[deleteTarget.item.id];
        return next;
      });
      setAuthEmployeePins((current) => {
        const next = { ...(current || {}) };
        delete next[deleteTarget.item.id];
        return next;
      });
    }
    setDeleteTarget(null);
  };
  const deleteDialog = deleteTarget ? {
    title: deleteTarget.type === "archive" ? text(lang, "archiveStoreTitle") : deleteTarget.type === "store" ? text(lang, deleteTarget.hasRecords ? "storeDeleteWithDataTitle" : "storeDeleteEmptyTitle") : text(lang, deleteTarget.type === "channel" ? "channelDeleteTitle" : "userDeleteTitle"),
    desc: deleteTarget.type === "archive" ? text(lang, "archiveStoreDesc") : deleteTarget.type === "store" ? text(lang, deleteTarget.hasRecords ? "storeDeleteWithDataDesc" : "storeDeleteEmptyDesc") : text(lang, deleteTarget.type === "channel" ? "channelDeleteDesc" : "userDeleteDesc"),
    action: deleteTarget.type === "archive" ? text(lang, "confirmArchive") : deleteTarget.type === "store" ? text(lang, deleteTarget.hasRecords ? "archiveAndKeepData" : "deleteEmptyStore") : text(lang, deleteTarget.type === "channel" ? "retireChannel" : "revokeAccess"),
  } : null;
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
    const ownerProfileDirty = draftOwnerName.trim() && draftOwnerName.trim() !== ownerProfile?.name;
    const authDirty = draftAuthOwnerUsername.trim() !== (authOwnerUsername || "")
      || draftAuthOwnerPassword.trim() !== (authOwnerPassword || "");
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
  if (section === "stores") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "المحلات" : "Shops"} onBack={() => setSection("home")} /><div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold text-[#716753]">{text(lang, "activeStores")}</p><button onClick={() => setShowAddStore(!showAddStore)} className="flex items-center gap-1 text-taq-meta font-black text-[#9A823E]"><Plus className="h-3.5 w-3.5" />{text(lang, "addStore")}</button></div>{showAddStore && <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><input value={newStoreName} onChange={(event) => setNewStoreName(event.target.value)} placeholder={text(lang, "newStoreName")} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" /><input value={newStoreLocation} onChange={(event) => setNewStoreLocation(event.target.value)} placeholder={text(lang, "newStoreLocation")} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" /><button onClick={addStore} className="w-full rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "confirmAddStore")}</button></div>}<div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{activeStoredBusinesses.length ? activeStoredBusinesses.map((business, index) => <button key={business.id} onClick={() => openStore(business.id)} className={`flex w-full items-center justify-between px-4 py-4 text-start ${index < activeStoredBusinesses.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}><div><p className="text-xs font-black">{displayBusinessName(business)}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{displayLocation(business)} · <span className="text-[#257844]">{text(lang, "storeActive")}</span></p></div><Arrow className="h-4 w-4 text-[#B99844]" /></button>) : <p className="p-5 text-center text-xs font-bold text-[#827762]">{text(lang, "noActiveStores")}</p>}</div>{archivedStoredBusinesses.length > 0 && <><button onClick={() => setShowArchivedStores(!showArchivedStores)} className="mb-3 flex items-center gap-1 text-taq-meta font-black text-[#9A823E]">{text(lang, showArchivedStores ? "hideArchived" : "showArchived")} ({archivedStoredBusinesses.length})<ChevronDown className={`h-3.5 w-3.5 ${showArchivedStores ? "rotate-180" : ""}`} /></button>{showArchivedStores && <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">{archivedStoredBusinesses.map((business) => <button key={business.id} onClick={() => openStore(business.id)} className="flex w-full items-center justify-between px-4 py-4 text-start opacity-70"><div><p className="text-xs font-black">{displayBusinessName(business)}</p><p className="mt-1 text-taq-meta font-bold text-[#B96725]">{text(lang, "archivedStore")}</p></div><Arrow className="h-4 w-4" /></button>)}</div>}</>}<DeleteDialog /></motion.section>;
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
                    {person.active ? text(lang, "active") : text(lang, "stopChannel")} · {employeeStoreIds(person).length} {lang === "ar" ? "محل" : "shop(s)"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <SettingToggle disabled={!managingTeam} enabled={person.active} onToggle={() => toggleEmployeeActive(person.id)} />
                  {managingTeam && (
                    <button onClick={() => setDeleteTarget({ type: "staff", item: person })} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#B44747]">
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
  if (section === "appearance") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "notebookAppearance")} onBack={() => setSection("home")} /><div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="mb-2 text-taq-meta font-bold text-[#827762]">{lang === "ar" ? "اختر شكل دفتر التقفيلة والتقارير وصور المشاركة." : "Choose the notebook style for closeouts, reports, and sharing."}</p><ThemePicker lang={lang} theme={draftNotebookTheme} onChange={(nextTheme) => { setDraftNotebookTheme(nextTheme); setThemeDirty(nextTheme !== notebookTheme); }} /><p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "autoSavedAccount")}</p>{themeDirty && <div className="mt-4 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={() => { setDraftNotebookTheme(notebookTheme); setThemeDirty(false); }} className="rounded-2xl bg-[#F7F5EF] py-3 text-xs font-black">{text(lang, "cancelChanges")}</button><button onClick={() => { setNotebookTheme(draftNotebookTheme); setThemeDirty(false); showSettingsSaved(); }} className="rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "saveSettings")}</button></div>}{settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}</div></motion.section>;
  if (section === "subscription") return APP_IN_PRODUCTION_MODE ? <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "الخطة والاشتراك" : "Plan & subscription"} onBack={() => setSection("home")} /><div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]"><Badge tone="warning">{lang === "ar" ? "معطّل حاليًا" : "Disabled for now"}</Badge><p className="mt-4 text-taq-meta font-bold leading-6 text-[#716753]">{lang === "ar" ? "تم تعطيل SaaS في مرحلة الإطلاق الحالية. سيتم تفعيله لاحقًا دون التأثير على تشغيل المحلات." : "SaaS billing is disabled for the current launch phase and will be enabled later without affecting store operations."}</p></div></motion.section> : <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={lang === "ar" ? "الخطة والاشتراك" : "Plan & subscription"} onBack={() => setSection("home")} /><div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]"><Badge tone="navy">{text(lang, "currentPlan")}</Badge><h3 className="mt-4 text-lg font-black">{lang === "ar" ? "نسخة التطوير الحالية" : "Current development access"}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "monthlyPrice")}</p><div className="mt-5 rounded-2xl bg-[#FFF4D2] p-4 text-taq-meta font-bold leading-6 text-[#806528]">{lang === "ar" ? "سيتم ربط الاشتراك بالمنشأة وليس بالمحل، مع تحديد عدد المحلات والموظفين وميزات التصدير لاحقًا." : "Subscription will be tied to the organization, not an individual shop, with plan limits added later."}</div></div></motion.section>;
  if (section === "support") return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><PageHeader title={text(lang, "support")} onBack={() => setSection("home")} /><div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Smartphone} title={text(lang, "whatsappSupport")} onClick={onOpenSupport} border /><SettingsLink icon={FileText} title={text(lang, "helpCenter")} onClick={onOpenHelp} border={false} /></div></motion.section>;
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24"><div className="mb-5"><p className="text-xs font-bold text-[#8B8274]">{text(lang, "ownerAccount")}</p><h1 className="text-xl font-black">{text(lang, "settings")}</h1></div><button onClick={() => setSection("account")} className="mb-5 flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-start ring-1 ring-black/[0.045]"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#112A46] text-white"><UserRound className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="text-sm font-black">{ownerProfile?.name || text(lang, "ownerName")}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "myAccountSecurity")}</p></div><Arrow className="h-4 w-4 shrink-0 text-[#B99844]" /></button><p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "المنشأة" : "Organization"}</p><div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Building2} title={lang === "ar" ? "المحلات" : "Shops"} value={`${activeStoredBusinesses.length}`} onClick={() => setSection("stores")} /><SettingsLink icon={UserRound} title={lang === "ar" ? "الفريق والصلاحيات" : "Team & access"} value={`${visibleStaff.length}`} onClick={() => setSection("team")} />{APP_IN_PRODUCTION_MODE ? null : <SettingsLink icon={CreditCard} title={lang === "ar" ? "الخطة والاشتراك" : "Plan & subscription"} value={lang === "ar" ? "تجريبي" : "Trial"} onClick={() => setSection("subscription")} border={false} />}</div><p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "التفضيلات" : "Preferences"}</p><div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={ReceiptText} title={text(lang, "notebookAppearance")} value={text(lang, notebookTheme)} onClick={() => setSection("appearance")} border={false} /></div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "support")}</p><div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]"><SettingsLink icon={Smartphone} title={text(lang, "contactSupport")} onClick={() => setSection("support")} /><SettingsLink icon={UserRound} title={text(lang, "logout")} onClick={onLogout} danger border={false} /></div></motion.section>;
}