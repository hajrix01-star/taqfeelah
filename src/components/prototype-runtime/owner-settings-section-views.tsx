"use client";

import React from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  canAddStore,
  resolveStoreLimitMessage,
} from "@/features/billing/client/entitlement-guards";
import { text } from "./prototype-runtime-demo-data";
import { OwnerSettingsDeleteDialog } from "./owner-settings-delete-dialog-ui";
import {
  SettingsPageHeader,
} from "./owner-settings-ui-primitives";
import { OwnerSettingsTeamSectionWithInvites } from "./owner-settings-team-section-with-invites";
import { OwnerSettingsTeamRoster } from "./owner-settings-team-roster";
import { OwnerSettingsAccountSection } from "./owner-settings-account-section";
import { OwnerSettingsAppearanceSection } from "./owner-settings-appearance-section";
import { OwnerSettingsHomeSection } from "./owner-settings-home-section";
import { OwnerSettingsSupportSection } from "./owner-settings-support-section";
import { SettingsSectionFrame } from "./owner-settings-section-frame";
import type {
  OwnerSettingsDeleteDialogProps,
  OwnerSettingsSectionCommonProps,
  OwnerSettingsSectionRenderOptions,
  OwnerSettingsTabbedShellCallbacks,
  OwnerSettingsViewState,
  PrototypeBusiness,
} from "./prototype-runtime-types";
import type { StaffMember } from "@/features/org-config/client/org-config-client-types";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/client/billing-client-types";

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

export function OwnerSettingsStoresSection({
  lang,
  showAddStore,
  setShowAddStore,
  newStoreName,
  setNewStoreName,
  newStoreLocation,
  setNewStoreLocation,
  addStore,
  activeStoredBusinesses,
  archivedStoredBusinesses,
  showArchivedStores,
  setShowArchivedStores,
  displayBusinessName,
  displayLocation,
  openStore,
  setSection,
  deleteDialogProps,
  orgConfigLoading = false,
  storeSaving = false,
  settingsNotice = "",
  settingsSuccess = false,
  entitlements = null,
  embedded = false,
  countEmployeesForStore = null,
}: OwnerSettingsSectionCommonProps & {
  showAddStore: boolean;
  setShowAddStore: (value: boolean) => void;
  newStoreName: string;
  setNewStoreName: (value: string) => void;
  newStoreLocation: string;
  setNewStoreLocation: (value: string) => void;
  addStore: () => void | Promise<void>;
  activeStoredBusinesses: PrototypeBusiness[];
  archivedStoredBusinesses: PrototypeBusiness[];
  showArchivedStores: boolean;
  setShowArchivedStores: (value: boolean) => void;
  displayBusinessName: (business: PrototypeBusiness) => string;
  displayLocation: (business: PrototypeBusiness) => string;
  openStore: (storeId: string) => void;
  deleteDialogProps: OwnerSettingsDeleteDialogProps;
  orgConfigLoading?: boolean;
  storeSaving?: boolean;
  settingsNotice?: string;
  settingsSuccess?: boolean;
  entitlements?: ResolvedOrganizationEntitlements | null;
  countEmployeesForStore?: ((storeId: string) => number) | null;
}) {
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  const atStoreLimit = entitlements ? !canAddStore(entitlements) : false;
  const storeLimitMessage = atStoreLimit ? resolveStoreLimitMessage(entitlements, lang) : "";
  return (
    <SettingsSectionFrame embedded={embedded}>
      {!embedded ? (
        <SettingsPageHeader title={lang === "ar" ? "المحلات" : "Shops"} onBack={() => setSection("home")} lang={lang} />
      ) : null}
      {orgConfigLoading ? (
        <div className="rounded-3xl bg-white p-5 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-black/[0.045]">
          {lang === "ar" ? "جارٍ تحميل المحلات من السيرفر..." : "Loading stores from server..."}
        </div>
      ) : (
        <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-[#716753]">{text(lang, "activeStores")}</p>
        <button onClick={() => setShowAddStore(!showAddStore)} className="flex items-center gap-1 text-taq-meta font-black text-[#9A823E]"><Plus className="h-3.5 w-3.5" />{text(lang, "addStore")}</button>
      </div>
      {showAddStore && (
        <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
          {atStoreLimit ? (
            <p className="mb-4 rounded-2xl bg-[#FFF1EE] p-3 text-center text-taq-meta font-bold leading-6 text-[#B44747]">
              {storeLimitMessage}
            </p>
          ) : null}
          <input value={newStoreName} onChange={(event) => setNewStoreName(event.target.value)} placeholder={text(lang, "newStoreName")} disabled={atStoreLimit} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none disabled:opacity-60" />
          <input value={newStoreLocation} onChange={(event) => setNewStoreLocation(event.target.value)} placeholder={text(lang, "newStoreLocation")} disabled={atStoreLimit} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none disabled:opacity-60" />
          <button type="button" onClick={() => { void addStore(); }} disabled={storeSaving || atStoreLimit} className="w-full rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white disabled:opacity-60">
            {storeSaving ? (lang === "ar" ? "جارٍ الحفظ..." : "Saving...") : text(lang, "confirmAddStore")}
          </button>
        </div>
      )}
      {(settingsNotice || settingsSuccess) ? (
        <div className="mb-4">
          {settingsNotice ? (
            <p className="rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>
          ) : null}
          {settingsSuccess ? (
            <div className="mt-2 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>
          ) : null}
        </div>
      ) : null}
      <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        {activeStoredBusinesses.length ? activeStoredBusinesses.map((business, index) => (
          <button key={business.id} onClick={() => openStore(business.id)} className={`flex w-full items-center justify-between px-4 py-4 text-start ${index < activeStoredBusinesses.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}>
            <div>
              <p className="text-xs font-black">{displayBusinessName(business)}</p>
              <p className="mt-1 text-taq-meta font-bold text-[#827762]">
                {displayLocation(business)}{" "}
                <span className="text-[#257844]">{text(lang, "storeActive")}</span>
                {typeof countEmployeesForStore === "function" ? (
                  <span className="text-[#716753]">
                    {" · "}
                    {countEmployeesForStore(business.id)}
                    {lang === "ar" ? " موظف" : " staff"}
                  </span>
                ) : null}
              </p>
            </div>
            <Arrow className="h-4 w-4 text-[#B99844]" />
          </button>
        )) : <p className="p-5 text-center text-xs font-bold text-[#827762]">{text(lang, "noActiveStores")}</p>}
      </div>
      {archivedStoredBusinesses.length > 0 && (
        <>
          <button onClick={() => setShowArchivedStores(!showArchivedStores)} className="mb-3 flex items-center gap-1 text-taq-meta font-black text-[#9A823E]">
            {text(lang, showArchivedStores ? "hideArchived" : "showArchived")} ({archivedStoredBusinesses.length})
            <ChevronDown className={`h-3.5 w-3.5 ${showArchivedStores ? "rotate-180" : ""}`} />
          </button>
          {showArchivedStores && (
            <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
              {archivedStoredBusinesses.map((business) => (
                <button key={business.id} onClick={() => openStore(business.id)} className="flex w-full items-center justify-between px-4 py-4 text-start opacity-70">
                  <div>
                    <p className="text-xs font-black">{displayBusinessName(business)}</p>
                    <p className="mt-1 text-taq-meta font-bold text-[#B96725]">{text(lang, "archivedStore")}</p>
                  </div>
                  <Arrow className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
        </>
      )}
      <OwnerSettingsDeleteDialog {...deleteDialogProps} />
    </SettingsSectionFrame>
  );
}

export function OwnerSettingsTeamSection({
  lang,
  managingTeam,
  startManagingTeam,
  cancelManagingTeam,
  visibleStaff,
  employeeStoreIds,
  toggleEmployeeActive,
  setDeleteTarget,
  activeStoredBusinesses,
  displayBusinessName,
  toggleEmployeeStore,
  draftAuthEmployeePins,
  updateDraftEmployeePin,
  updateEmployeeMobile,
  newEmployeeName,
  setNewEmployeeName,
  newEmployeeMobile,
  setNewEmployeeMobile,
  newEmployeeStoreIds,
  toggleNewEmployeeStore,
  addStaff,
  teamSaving,
  saveManagingTeam,
  setSection,
  deleteDialogProps,
  inviteApiContext,
  orgConfigLoading = false,
  settingsNotice = "",
  embedded = false,
}: OwnerSettingsSectionCommonProps & {
  managingTeam: boolean;
  startManagingTeam: () => void;
  cancelManagingTeam: () => void;
  visibleStaff: StaffMember[];
  employeeStoreIds: (person: StaffMember) => string[];
  toggleEmployeeActive: (personId: string) => void;
  setDeleteTarget: (target: unknown) => void;
  activeStoredBusinesses: PrototypeBusiness[];
  displayBusinessName: (business: PrototypeBusiness) => string;
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
  deleteDialogProps: OwnerSettingsDeleteDialogProps;
  inviteApiContext?: Record<string, unknown> | null;
  orgConfigLoading?: boolean;
  settingsNotice?: string;
}) {
  return (
    <SettingsSectionFrame embedded={embedded}>
      {!embedded ? (
        <SettingsPageHeader
          title={lang === "ar" ? "الفريق والصلاحيات" : "Team & access"}
          onBack={() => { cancelManagingTeam(); setSection("home"); }}
          lang={lang}
        />
      ) : null}
      {settingsNotice ? (
        <div className="mb-4 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{settingsNotice}</div>
      ) : null}
      {orgConfigLoading ? (
        <div className="rounded-3xl bg-white p-5 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-black/[0.045]">
          {lang === "ar" ? "جارٍ تحميل الفريق من السيرفر..." : "Loading team from server..."}
        </div>
      ) : (
        <>
      {inviteApiContext?.organizationId && inviteApiContext?.actorUserId ? (
        <OwnerSettingsTeamSectionWithInvites
          inviteApiContext={inviteApiContext}
          lang={lang}
          activeStoredBusinesses={activeStoredBusinesses}
          displayBusinessName={displayBusinessName}
          rosterProps={{
            lang,
            managingTeam,
            startManagingTeam,
            cancelManagingTeam,
            visibleStaff,
            employeeStoreIds,
            toggleEmployeeActive,
            setDeleteTarget,
            toggleEmployeeStore,
            draftAuthEmployeePins,
            updateDraftEmployeePin,
            updateEmployeeMobile,
            newEmployeeName,
            setNewEmployeeName,
            newEmployeeMobile,
            setNewEmployeeMobile,
            newEmployeeStoreIds,
            toggleNewEmployeeStore,
            addStaff,
          } as import("./prototype-runtime-types").OwnerSettingsTeamRosterProps}
        />
      ) : (
        <OwnerSettingsTeamRoster
          lang={lang}
          managingTeam={managingTeam}
          startManagingTeam={startManagingTeam}
          cancelManagingTeam={cancelManagingTeam}
          visibleStaff={visibleStaff}
          employeeStoreIds={employeeStoreIds}
          toggleEmployeeActive={toggleEmployeeActive}
          setDeleteTarget={setDeleteTarget}
          activeStoredBusinesses={activeStoredBusinesses}
          displayBusinessName={displayBusinessName}
          toggleEmployeeStore={toggleEmployeeStore}
          draftAuthEmployeePins={draftAuthEmployeePins}
          updateDraftEmployeePin={updateDraftEmployeePin}
          updateEmployeeMobile={updateEmployeeMobile}
          newEmployeeName={newEmployeeName}
          setNewEmployeeName={setNewEmployeeName}
          newEmployeeMobile={newEmployeeMobile}
          setNewEmployeeMobile={setNewEmployeeMobile}
          newEmployeeStoreIds={newEmployeeStoreIds}
          toggleNewEmployeeStore={toggleNewEmployeeStore}
          addStaff={addStaff}
        />
      )}
      {managingTeam && (
        <div className="grid grid-cols-[0.9fr_1.35fr] gap-3">
          <button onClick={cancelManagingTeam} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.05]">{text(lang, "cancelChanges")}</button>
          <button type="button" disabled={teamSaving} onClick={() => { void saveManagingTeam(); }} className={`rounded-2xl py-3.5 text-xs font-black text-white ${teamSaving ? "bg-[#B8C0B7]" : "bg-[#112A46]"}`}>{text(lang, "saveTeamChanges")}</button>
        </div>
      )}
        </>
      )}
      <OwnerSettingsDeleteDialog {...deleteDialogProps} />
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
