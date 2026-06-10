"use client";

import React from "react";
import { motion } from "framer-motion";
import { Building2, CreditCard, Plus, ReceiptText, Trash2, UserRound, Bell } from "lucide-react";
import EmployeeHistoryVisibilityPicker from "@/features/employee-closeouts/EmployeeHistoryVisibilityPicker";
import { channelName, expenseCategories, text } from "./prototype-runtime-demo-data";
import { OwnerSettingsDeleteDialog } from "./owner-settings-delete-dialog-ui";
import {
  Badge,
  SettingRow,
  SettingToggle,
  SettingsLink,
  SettingsPageHeader,
} from "./owner-settings-ui-primitives";
import { ThemePicker } from "./prototype-runtime-notebook";

export function OwnerSettingsStoreProfilePanel({
  lang,
  draftStoreName,
  setDraftStoreName,
  draftStoreLocation,
  setDraftStoreLocation,
  saveStoreProfile,
  backFromStorePanel,
  deleteDialogProps,
}) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
      <SettingsPageHeader title={lang === "ar" ? "بيانات المحل" : "Shop details"} onBack={backFromStorePanel} lang={lang} />
      <div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "shopName")}</p>
        <input value={draftStoreName} onChange={(event) => setDraftStoreName(event.target.value)} maxLength={80} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
        <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "newStoreLocation")}</p>
        <input value={draftStoreLocation} onChange={(event) => setDraftStoreLocation(event.target.value)} maxLength={100} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
        <p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "renameStoreHint")}</p>
        <button disabled={!draftStoreName.trim()} onClick={saveStoreProfile} className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${draftStoreName.trim() ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{text(lang, "saveSettings")}</button>
      </div>
      <OwnerSettingsDeleteDialog {...deleteDialogProps} />
    </motion.section>
  );
}

export function OwnerSettingsStoreChannelsPanel({
  lang,
  visibleChannels,
  channelConfig,
  retiredChannels,
  newChannelName,
  setNewChannelName,
  toggleChannel,
  requestRetireChannel,
  restoreSalesChannel,
  addSalesChannel,
  settingsNotice,
  backFromStorePanel,
  saveChannelSettings,
  deleteDialogProps,
}) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
      <SettingsPageHeader title={text(lang, "salesChannels")} onBack={backFromStorePanel} lang={lang} />
      <p className="mb-3 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "channelControlHint")}</p>
      <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        {visibleChannels.map((channel, index) => (
          <div key={channel.id} className={`flex items-center justify-between gap-3 px-4 py-4 ${index < visibleChannels.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}>
            <div className="min-w-0">
              <p className="text-xs font-black">{channelName(channel, lang)}</p>
              <p className="mt-1 text-taq-meta font-bold text-[#827762]">{channelConfig.activeIds.includes(channel.id) ? text(lang, "active") : text(lang, "stopChannel")}</p>
            </div>
            <div className="flex items-center gap-2">
              <SettingToggle enabled={channelConfig.activeIds.includes(channel.id)} onToggle={() => toggleChannel(channel.id)} />
              <button onClick={() => requestRetireChannel(channel)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1EE] text-[#B44747]"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <p className="mb-3 text-xs font-black">{text(lang, "addChannel")}</p>
        <div className="flex gap-2">
          <input value={newChannelName} onChange={(event) => setNewChannelName(event.target.value)} placeholder={text(lang, "newChannelName")} className="min-w-0 flex-1 rounded-2xl bg-[#F7F5EF] px-3 py-3 text-xs font-bold outline-none" />
          <button onClick={addSalesChannel} className="rounded-2xl bg-[#112A46] px-4 text-xs font-black text-white"><Plus className="h-4 w-4" /></button>
        </div>
        {retiredChannels.length > 0 && (
          <div className="mt-4 border-t border-[#F0ECE2] pt-4">
            <p className="mb-2 text-taq-meta font-bold text-[#827762]">{text(lang, "stoppedChannels")}</p>
            {retiredChannels.map((channel) => (
              <button key={channel.id} onClick={() => restoreSalesChannel(channel)} className="mb-2 flex w-full items-center justify-between rounded-xl bg-[#F7F5EF] px-3 py-3 text-taq-meta font-black text-[#257844]">
                <span>{channelName(channel, lang)}</span>
                <span>{text(lang, "restoreChannel")}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {settingsNotice && <p className="mb-3 rounded-xl bg-[#FFF1EE] p-3 text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>}
      <div className="grid grid-cols-[0.9fr_1.35fr] gap-3">
        <button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button>
        <button onClick={saveChannelSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button>
      </div>
      <OwnerSettingsDeleteDialog {...deleteDialogProps} />
    </motion.section>
  );
}

export function OwnerSettingsStoreExpensesPanel({
  lang,
  operationalConfig,
  toggleCategory,
  settingsNotice,
  backFromStorePanel,
  saveOperationalSettings,
}) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
      <SettingsPageHeader title={text(lang, "outflowCategories")} onBack={backFromStorePanel} lang={lang} />
      <p className="mb-3 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{lang === "ar" ? "تظهر هذه البنود عند اختيار نوع العملية: مصروف. إيقاف البند لا يغير التقارير السابقة." : "These items appear only for Expense entries. Disabling an item does not change historical reports."}</p>
      <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        {expenseCategories.map((item, index) => (
          <div key={item.id} className={`flex items-center justify-between px-4 py-4 ${index < expenseCategories.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}>
            <p className="text-xs font-black">{text(lang, item.label)}</p>
            <SettingToggle enabled={operationalConfig.activeCategories.includes(item.id)} onToggle={() => toggleCategory(item.id)} />
          </div>
        ))}
      </div>
      {settingsNotice && <p className="mb-3 rounded-xl bg-[#FFF1EE] p-3 text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>}
      <p className="mb-4 text-taq-meta font-bold leading-5 text-[#827762]">{lang === "ar" ? "إضافة بنود مخصصة ستنفذ في النسخة الإنتاجية بعد بناء نموذج البيانات الموحد." : "Custom expense items will be implemented in the production build with the unified data model."}</p>
      <div className="grid grid-cols-[0.9fr_1.35fr] gap-3">
        <button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button>
        <button onClick={saveOperationalSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button>
      </div>
    </motion.section>
  );
}

export function OwnerSettingsStoreAlertsPanel({
  lang,
  operationalConfig,
  notebookTheme,
  updateOperationalDraft,
  backFromStorePanel,
  saveOperationalSettings,
}) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
      <SettingsPageHeader title={lang === "ar" ? "التنبيهات والتفضيلات" : "Alerts & preferences"} onBack={backFromStorePanel} lang={lang} />
      <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <SettingRow title={text(lang, "dailyCloseoutAlert")} desc={text(lang, "dailyCloseoutAlertPrototype")} toggle={<SettingToggle enabled={operationalConfig.closeoutAlert} onToggle={() => updateOperationalDraft({ closeoutAlert: !operationalConfig.closeoutAlert })} />} />
      </div>
      <EmployeeHistoryVisibilityPicker lang={lang} value={operationalConfig.employeeHistoryVisibility || "all"} onChange={(next) => updateOperationalDraft({ employeeHistoryVisibility: next })} />
      <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <p className="mb-2 text-xs font-black">{lang === "ar" ? "شكل دفتر هذا المحل" : "This store notebook theme"}</p>
        <ThemePicker lang={lang} theme={operationalConfig.notebookTheme || notebookTheme} onChange={(nextTheme) => updateOperationalDraft({ notebookTheme: nextTheme })} />
        <p className="mt-3 text-taq-meta font-bold leading-5 text-[#806528]">{lang === "ar" ? "يُستخدم في واجهة الموظف لهذا المحل ما لم يغيّر الموظف لونه الشخصي." : "Used for this store's employee UI unless the employee picks a personal theme."}</p>
      </div>
      <div className="grid grid-cols-[0.9fr_1.35fr] gap-3">
        <button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button>
        <button onClick={saveOperationalSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button>
      </div>
    </motion.section>
  );
}

export function OwnerSettingsStoreStaffPanel({
  lang,
  linkedStaff,
  closeStore,
  setSection,
  backFromStorePanel,
}) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
      <SettingsPageHeader title={text(lang, "linkedEmployees")} onBack={backFromStorePanel} lang={lang} />
      <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        {linkedStaff.length ? linkedStaff.map((person, index) => (
          <div key={person.id} className={`flex items-center gap-3 py-3 ${index < linkedStaff.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}>
            <UserRound className="h-5 w-5 text-[#806528]" />
            <div>
              <p className="text-xs font-black">{lang === "ar" ? person.nameAr : person.nameEn}</p>
              <p dir="ltr" className="text-taq-meta text-[#827762]">{person.mobile}</p>
            </div>
          </div>
        )) : <p className="text-xs font-bold text-[#827762]">{text(lang, "noLinkedEmployees")}</p>}
      </div>
      <button onClick={() => { closeStore(); setSection("team"); }} className="w-full rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{lang === "ar" ? "إدارة الفريق والصلاحيات" : "Manage team access"}</button>
    </motion.section>
  );
}

export function OwnerSettingsStoreOverviewPanel({
  lang,
  selectedStore,
  displayBusinessName,
  displayLocation,
  archived,
  activeChannelCount,
  activeCategoryCount,
  operationalConfig,
  linkedStaff,
  openStorePanel,
  setArchivedReadOnlyBusinessId,
  setSelectedBusiness,
  setOwnerPage,
  toggleArchive,
  requestArchiveStore,
  openStoreDelete,
  settingsSuccess,
  closeStore,
  deleteDialogProps,
}) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
      <SettingsPageHeader title={text(lang, "storeSettings")} onBack={closeStore} lang={lang} />
      <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#112A46] text-[#E4B84A]"><Building2 className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">{displayBusinessName(selectedStore)}</p>
            <p className="mt-1 truncate text-taq-meta font-bold text-[#827762]">{displayLocation(selectedStore)}</p>
          </div>
          <Badge tone={archived ? "warning" : "success"}>{text(lang, archived ? "archivedStore" : "storeActive")}</Badge>
        </div>
      </div>
      <div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <SettingsLink lang={lang} icon={Building2} title={lang === "ar" ? "بيانات المحل" : "Shop details"} desc={displayLocation(selectedStore)} onClick={() => openStorePanel("profile")} />
        <SettingsLink lang={lang} icon={CreditCard} title={text(lang, "salesChannels")} value={`${activeChannelCount}`} onClick={() => openStorePanel("channels")} />
        <SettingsLink lang={lang} icon={ReceiptText} title={text(lang, "outflowCategories")} value={`${activeCategoryCount}`} onClick={() => openStorePanel("expenses")} />
        <SettingsLink lang={lang} icon={Bell} title={lang === "ar" ? "التنبيهات والتفضيلات" : "Alerts & preferences"} value={operationalConfig.closeoutAlert ? text(lang, "active") : text(lang, "stopChannel")} onClick={() => openStorePanel("alerts")} />
        <SettingsLink lang={lang} icon={UserRound} title={text(lang, "linkedEmployees")} value={`${linkedStaff.length}`} onClick={() => openStorePanel("staff")} border={false} />
      </div>
      {archived && (
        <div className="mb-5 rounded-3xl bg-[#FFF4D2] p-4">
          <Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge>
          <p className="mt-3 text-taq-meta font-bold text-[#806528]">{text(lang, "archiveNotice")}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => { setArchivedReadOnlyBusinessId(selectedStore.id); setSelectedBusiness(selectedStore.id); setOwnerPage("reports"); }} className="rounded-xl bg-white py-3 text-taq-meta font-black">{text(lang, "viewPastReports")}</button>
            <button onClick={() => { setArchivedReadOnlyBusinessId(selectedStore.id); setSelectedBusiness(selectedStore.id); setOwnerPage("register"); }} className="rounded-xl bg-white py-3 text-taq-meta font-black">{text(lang, "viewPastAttachments")}</button>
          </div>
        </div>
      )}
      <p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "الإدارة" : "Management"}</p>
      {archived ? (
        <button onClick={() => toggleArchive(selectedStore.id)} className="w-full rounded-2xl bg-white py-3.5 text-xs font-black text-[#257844] ring-1 ring-black/[0.05]">{text(lang, "storeActive")}</button>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => requestArchiveStore(selectedStore)} className="flex-1 rounded-2xl bg-white py-3.5 text-xs font-black text-[#B96725] ring-1 ring-black/[0.05]">{text(lang, "archiveStore")}</button>
          <button onClick={() => openStoreDelete(selectedStore)} className="flex-1 rounded-2xl bg-[#FFF1EE] py-3.5 text-xs font-black text-[#B44747]">{text(lang, "deleteStore")}</button>
        </div>
      )}
      {settingsSuccess && <div className="mt-4 rounded-2xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}
      <OwnerSettingsDeleteDialog {...deleteDialogProps} />
    </motion.section>
  );
}

export function renderOwnerSettingsStorePanel(storePanel, state) {
  const common = { lang: state.lang };
  if (storePanel === "profile") {
    return (
      <OwnerSettingsStoreProfilePanel
        {...common}
        draftStoreName={state.draftStoreName}
        setDraftStoreName={state.setDraftStoreName}
        draftStoreLocation={state.draftStoreLocation}
        setDraftStoreLocation={state.setDraftStoreLocation}
        saveStoreProfile={state.saveStoreProfile}
        backFromStorePanel={state.backFromStorePanel}
        deleteDialogProps={state.deleteDialogProps}
      />
    );
  }
  if (storePanel === "channels") {
    return (
      <OwnerSettingsStoreChannelsPanel
        {...common}
        visibleChannels={state.visibleChannels}
        channelConfig={state.channelConfig}
        retiredChannels={state.retiredChannels}
        newChannelName={state.newChannelName}
        setNewChannelName={state.setNewChannelName}
        toggleChannel={state.toggleChannel}
        requestRetireChannel={state.requestRetireChannel}
        restoreSalesChannel={state.restoreSalesChannel}
        addSalesChannel={state.addSalesChannel}
        settingsNotice={state.settingsNotice}
        backFromStorePanel={state.backFromStorePanel}
        saveChannelSettings={state.saveChannelSettings}
        deleteDialogProps={state.deleteDialogProps}
      />
    );
  }
  if (storePanel === "expenses") {
    return (
      <OwnerSettingsStoreExpensesPanel
        {...common}
        operationalConfig={state.operationalConfig}
        toggleCategory={state.toggleCategory}
        settingsNotice={state.settingsNotice}
        backFromStorePanel={state.backFromStorePanel}
        saveOperationalSettings={state.saveOperationalSettings}
      />
    );
  }
  if (storePanel === "alerts") {
    return (
      <OwnerSettingsStoreAlertsPanel
        {...common}
        operationalConfig={state.operationalConfig}
        notebookTheme={state.notebookTheme}
        updateOperationalDraft={state.updateOperationalDraft}
        backFromStorePanel={state.backFromStorePanel}
        saveOperationalSettings={state.saveOperationalSettings}
      />
    );
  }
  if (storePanel === "staff") {
    return (
      <OwnerSettingsStoreStaffPanel
        {...common}
        linkedStaff={state.linkedStaff}
        closeStore={state.closeStore}
        setSection={state.setSection}
        backFromStorePanel={state.backFromStorePanel}
      />
    );
  }
  return (
    <OwnerSettingsStoreOverviewPanel
      {...common}
      selectedStore={state.selectedStore}
      displayBusinessName={state.displayBusinessName}
      displayLocation={state.displayLocation}
      archived={state.archived}
      activeChannelCount={state.activeChannelCount}
      activeCategoryCount={state.activeCategoryCount}
      operationalConfig={state.operationalConfig}
      linkedStaff={state.linkedStaff}
      openStorePanel={state.openStorePanel}
      setArchivedReadOnlyBusinessId={state.setArchivedReadOnlyBusinessId}
      setSelectedBusiness={state.setSelectedBusiness}
      setOwnerPage={state.setOwnerPage}
      toggleArchive={state.toggleArchive}
      requestArchiveStore={state.requestArchiveStore}
      openStoreDelete={state.openStoreDelete}
      settingsSuccess={state.settingsSuccess}
      closeStore={state.closeStore}
      deleteDialogProps={state.deleteDialogProps}
    />
  );
}
