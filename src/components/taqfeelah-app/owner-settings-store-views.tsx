"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bell, Building2, CreditCard, ReceiptText } from "lucide-react";
import EmployeeHistoryVisibilityPicker from "@/features/employee-closeouts/EmployeeHistoryVisibilityPicker";
import { channelName, expenseCategories, text } from "./taqfeelah-app-reference-data";
import { OwnerSettingsDeleteDialog } from "./owner-settings-delete-dialog-ui";
import {
  Badge,
  SettingRow,
  SettingToggle,
  SettingsLink,
  SettingsPageHeader,
} from "./owner-settings-ui-primitives";
import { OwnerSettingsIncomeSourcesEditor } from "./owner-settings-income-sources-editor";
import { ThemePicker } from "./taqfeelah-app-notebook";
import {
  resolveSettingsStoreSubTabItem,
  SettingsStoreSubTabs,
  SettingsTabbedPanel,
} from "./owner-settings-tab-primitives";
import { normalizeStoreSettingsPanel } from "./owner-settings-tab-navigation";
import type {
  OwnerSettingsStoreAlertsPanelProps,
  OwnerSettingsStoreChannelsPanelProps,
  OwnerSettingsStoreExpensesPanelProps,
  OwnerSettingsStoreFlattenedPanelProps,
  OwnerSettingsStoreOverviewPanelProps,
  OwnerSettingsStoreProfilePanelProps,
  OwnerSettingsViewState,
} from "./taqfeelah-app-types";

export function OwnerSettingsStoreProfilePanel({
  lang,
  draftStoreName,
  setDraftStoreName,
  draftStoreLocation,
  setDraftStoreLocation,
  saveStoreProfile,
  backFromStorePanel,
  deleteDialogProps,
}: OwnerSettingsStoreProfilePanelProps) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <SettingsPageHeader title={lang === "ar" ? "بيانات المحل" : "Shop details"} onBack={backFromStorePanel} lang={lang} />
      <div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "shopName")}</p>
        <input value={draftStoreName} onChange={(event) => setDraftStoreName(event.target.value)} maxLength={80} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
        <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "newStoreLocation")}</p>
        <input value={draftStoreLocation} onChange={(event) => setDraftStoreLocation(event.target.value)} maxLength={100} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
        <button disabled={!draftStoreName.trim()} onClick={saveStoreProfile} className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${draftStoreName.trim() ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{text(lang, "saveSettings")}</button>
      </div>
      <OwnerSettingsDeleteDialog {...deleteDialogProps} />
    </motion.section>
  );
}

export function OwnerSettingsStoreChannelsPanel({
  lang,
  channelConfig,
  retiredChannels,
  newCustomIncomeSourceName,
  setNewCustomIncomeSourceName,
  toggleChannel,
  requestRetireChannel,
  restoreSalesChannel,
  deleteCustomIncomeSource,
  addCustomIncomeSource,
  settingsNotice,
  backFromStorePanel,
  saveChannelSettings,
  deleteDialogProps,
}: OwnerSettingsStoreChannelsPanelProps) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <SettingsPageHeader title={text(lang, "paymentMethods")} onBack={backFromStorePanel} lang={lang} />
      <OwnerSettingsIncomeSourcesEditor
        lang={lang}
        channelConfig={channelConfig}
        retiredChannels={retiredChannels}
        newCustomIncomeSourceName={newCustomIncomeSourceName}
        setNewCustomIncomeSourceName={setNewCustomIncomeSourceName}
        toggleChannel={toggleChannel}
        requestRetireChannel={requestRetireChannel}
        restoreSalesChannel={restoreSalesChannel}
        deleteCustomIncomeSource={deleteCustomIncomeSource}
        addCustomIncomeSource={addCustomIncomeSource}
        text={text}
        channelName={channelName}
      />
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
}: OwnerSettingsStoreExpensesPanelProps) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <SettingsPageHeader title={text(lang, "outflowCategories")} onBack={backFromStorePanel} lang={lang} />
      <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        {expenseCategories.map((item, index) => (
          <div key={item.id} className={`flex items-center justify-between px-4 py-4 ${index < expenseCategories.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}>
            <p className="text-xs font-black">{text(lang, item.label)}</p>
            <SettingToggle enabled={operationalConfig.activeCategories.includes(item.id)} onToggle={() => toggleCategory(item.id)} />
          </div>
        ))}
      </div>
      {settingsNotice && <p className="mb-3 rounded-xl bg-[#FFF1EE] p-3 text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>}
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
}: OwnerSettingsStoreAlertsPanelProps) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <SettingsPageHeader title={lang === "ar" ? "التنبيهات والتفضيلات" : "Alerts & preferences"} onBack={backFromStorePanel} lang={lang} />
      <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <SettingRow title={text(lang, "dailyCloseoutAlert")} toggle={<SettingToggle enabled={operationalConfig.closeoutAlert} onToggle={() => updateOperationalDraft({ closeoutAlert: !operationalConfig.closeoutAlert })} />} />
      </div>
      <EmployeeHistoryVisibilityPicker lang={lang} value={operationalConfig.employeeHistoryVisibility || "all"} onChange={(next) => updateOperationalDraft({ employeeHistoryVisibility: next })} />
      <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <p className="mb-2 text-xs font-black">{lang === "ar" ? "شكل دفتر هذا المحل" : "This store notebook theme"}</p>
        <ThemePicker lang={lang} theme={operationalConfig.notebookTheme || notebookTheme} onChange={(nextTheme) => updateOperationalDraft({ notebookTheme: nextTheme })} />
      </div>
      <div className="grid grid-cols-[0.9fr_1.35fr] gap-3">
        <button onClick={backFromStorePanel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button>
        <button onClick={saveOperationalSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button>
      </div>
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
}: OwnerSettingsStoreOverviewPanelProps) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
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
        <SettingsLink lang={lang} icon={CreditCard} title={text(lang, "paymentMethods")} value={`${activeChannelCount}`} onClick={() => openStorePanel("channels")} />
        <SettingsLink lang={lang} icon={ReceiptText} title={text(lang, "outflowCategories")} value={`${activeCategoryCount}`} onClick={() => openStorePanel("expenses")} />
        <SettingsLink lang={lang} icon={Bell} title={lang === "ar" ? "التنبيهات والتفضيلات" : "Alerts & preferences"} value={operationalConfig.closeoutAlert ? text(lang, "active") : text(lang, "stopChannel")} onClick={() => openStorePanel("alerts")} border={false} />
      </div>
      {archived && (
        <div className="mb-5 rounded-3xl bg-[#FFF4D2] p-4">
          <Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge>
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

export function OwnerSettingsStoreFlattenedPanel({
  lang,
  selectedStore,
  displayBusinessName,
  displayLocation,
  archived,
  operationalConfig,
  draftStoreName,
  setDraftStoreName,
  draftStoreLocation,
  setDraftStoreLocation,
  saveStoreProfile,
  channelConfig,
  retiredChannels,
  newCustomIncomeSourceName,
  setNewCustomIncomeSourceName,
  toggleChannel,
  requestRetireChannel,
  restoreSalesChannel,
  deleteCustomIncomeSource,
  addCustomIncomeSource,
  saveChannelSettings,
  cancelChannelDraft,
  toggleCategory,
  saveOperationalSettings,
  cancelOperationalDraft,
  notebookTheme,
  updateOperationalDraft,
  closeStore,
  setArchivedReadOnlyBusinessId,
  setSelectedBusiness,
  setOwnerPage,
  toggleArchive,
  requestArchiveStore,
  openStoreDelete,
  settingsSuccess,
  settingsNotice,
  deleteDialogProps,
  storePanel = "profile",
  openStorePanel,
}: OwnerSettingsStoreFlattenedPanelProps) {
  const activePanel = normalizeStoreSettingsPanel(storePanel);
  const activeTab = resolveSettingsStoreSubTabItem(lang, activePanel);

  const handleStoreTabChange = (nextPanel: string) => {
    openStorePanel?.(nextPanel);
  };

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <SettingsPageHeader
        title={displayBusinessName(selectedStore)}
        subtitle={displayLocation(selectedStore)}
        badge={<Badge tone={archived ? "warning" : "success"}>{text(lang, archived ? "archivedStore" : "storeActive")}</Badge>}
        onBack={closeStore}
        lang={lang}
      />

      <SettingsTabbedPanel
        sticky
        surfaceClass={activeTab.contentSurfaceClass}
        accentClass={activeTab.contentAccentClass}
        tabs={(
          <SettingsStoreSubTabs
            lang={lang}
            value={activePanel}
            onChange={handleStoreTabChange}
            ariaLabel={text(lang, "storeSettings")}
            integrated
          />
        )}
      >
          {activePanel === "profile" ? (
            <>
              <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "shopName")}</p>
              <input value={draftStoreName} onChange={(event) => setDraftStoreName(event.target.value)} maxLength={80} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
              <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "newStoreLocation")}</p>
              <input value={draftStoreLocation} onChange={(event) => setDraftStoreLocation(event.target.value)} maxLength={100} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
              <button disabled={!draftStoreName.trim()} onClick={saveStoreProfile} className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${draftStoreName.trim() ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{text(lang, "saveSettings")}</button>
            </>
          ) : null}

          {activePanel === "channels" ? (
            <>
              <OwnerSettingsIncomeSourcesEditor
                lang={lang}
                channelConfig={channelConfig}
                retiredChannels={retiredChannels}
                newCustomIncomeSourceName={newCustomIncomeSourceName}
                setNewCustomIncomeSourceName={setNewCustomIncomeSourceName}
                toggleChannel={toggleChannel}
                requestRetireChannel={requestRetireChannel}
                restoreSalesChannel={restoreSalesChannel}
                deleteCustomIncomeSource={deleteCustomIncomeSource}
                addCustomIncomeSource={addCustomIncomeSource}
                text={text}
                channelName={channelName}
              />
              {settingsNotice ? <p className="mb-3 rounded-xl bg-[#FFF1EE] p-3 text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p> : null}
              <div className="grid grid-cols-[0.9fr_1.35fr] gap-3">
                <button onClick={cancelChannelDraft} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button>
                <button onClick={saveChannelSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button>
              </div>
            </>
          ) : null}

          {activePanel === "expenses" ? (
            <>
              <div className="mb-4 overflow-hidden rounded-3xl bg-[#F7F5EF] ring-1 ring-black/[0.03]">
                {expenseCategories.map((item, index) => (
                  <div key={item.id} className={`flex items-center justify-between bg-white px-4 py-4 ${index < expenseCategories.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}>
                    <p className="text-xs font-black">{text(lang, item.label)}</p>
                    <SettingToggle enabled={operationalConfig.activeCategories.includes(item.id)} onToggle={() => toggleCategory(item.id)} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-[0.9fr_1.35fr] gap-3">
                <button onClick={cancelOperationalDraft} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button>
                <button onClick={saveOperationalSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button>
              </div>
            </>
          ) : null}

          {activePanel === "operations" ? (
            <>
              <div className="mb-4 overflow-hidden rounded-3xl bg-[#F7F5EF] ring-1 ring-black/[0.03]">
                <SettingRow title={text(lang, "dailyCloseoutAlert")} toggle={<SettingToggle enabled={operationalConfig.closeoutAlert} onToggle={() => updateOperationalDraft({ closeoutAlert: !operationalConfig.closeoutAlert })} />} />
              </div>
              <EmployeeHistoryVisibilityPicker lang={lang} value={operationalConfig.employeeHistoryVisibility || "all"} onChange={(next) => updateOperationalDraft({ employeeHistoryVisibility: next })} />
              <div className="mb-4 rounded-3xl bg-[#F7F5EF] p-4 ring-1 ring-black/[0.03]">
                <p className="mb-2 text-xs font-black">{lang === "ar" ? "شكل دفتر هذا المحل" : "This store notebook theme"}</p>
                <ThemePicker lang={lang} theme={operationalConfig.notebookTheme || notebookTheme} onChange={(nextTheme) => updateOperationalDraft({ notebookTheme: nextTheme })} />
              </div>
              <div className="grid grid-cols-[0.9fr_1.35fr] gap-3">
                <button onClick={cancelOperationalDraft} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button>
                <button onClick={saveOperationalSettings} className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white">{text(lang, "saveSettings")}</button>
              </div>
            </>
          ) : null}

          {settingsSuccess ? (
            <div className="mt-4 rounded-2xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>
          ) : null}
      </SettingsTabbedPanel>

      {archived ? (
        <div className="mt-4 rounded-3xl bg-[#FFF4D2] p-4">
          <Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setArchivedReadOnlyBusinessId(selectedStore.id); setSelectedBusiness(selectedStore.id); setOwnerPage("reports"); }} className="rounded-xl bg-white py-3 text-taq-meta font-black">{text(lang, "viewPastReports")}</button>
            <button type="button" onClick={() => { setArchivedReadOnlyBusinessId(selectedStore.id); setSelectedBusiness(selectedStore.id); setOwnerPage("register"); }} className="rounded-xl bg-white py-3 text-taq-meta font-black">{text(lang, "viewPastAttachments")}</button>
          </div>
        </div>
      ) : null}

      <p className="mb-2 mt-5 text-xs font-bold text-[#716753]">{lang === "ar" ? "الإدارة" : "Management"}</p>
      {archived ? (
        <button type="button" onClick={() => toggleArchive(selectedStore.id)} className="w-full rounded-2xl bg-white py-3.5 text-xs font-black text-[#257844] ring-1 ring-black/[0.05]">{text(lang, "storeActive")}</button>
      ) : (
        <div className="flex gap-3">
          <button type="button" onClick={() => requestArchiveStore(selectedStore)} className="flex-1 rounded-2xl bg-white py-3.5 text-xs font-black text-[#B96725] ring-1 ring-black/[0.05]">{text(lang, "archiveStore")}</button>
          <button type="button" onClick={() => openStoreDelete(selectedStore)} className="flex-1 rounded-2xl bg-[#FFF1EE] py-3.5 text-xs font-black text-[#B44747]">{text(lang, "deleteStore")}</button>
        </div>
      )}
      <OwnerSettingsDeleteDialog {...deleteDialogProps} />
    </motion.section>
  );
}

export function renderOwnerSettingsStorePanel(storePanel: string, state: OwnerSettingsViewState) {
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
        channelConfig={state.channelConfig}
        retiredChannels={state.retiredChannels}
        newCustomIncomeSourceName={state.newCustomIncomeSourceName}
        setNewCustomIncomeSourceName={state.setNewCustomIncomeSourceName}
        toggleChannel={state.toggleChannel}
        requestRetireChannel={state.requestRetireChannel}
        restoreSalesChannel={state.restoreSalesChannel}
        deleteCustomIncomeSource={state.deleteCustomIncomeSource}
        addCustomIncomeSource={state.addCustomIncomeSource}
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
