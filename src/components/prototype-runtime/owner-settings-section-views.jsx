"use client";

import React from "react";
import { motion } from "framer-motion";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";
import {
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
} from "lucide-react";
import { isNotebookThemeDirty } from "@/features/org-config/client/owner-settings-appearance-actions";
import { LoginPhoneFields } from "@/core/phone/LoginPhoneFields";
import { formatLoginPhoneForDisplay } from "@/core/phone/split-login-phone";
import { buildStaffDeleteTarget } from "@/features/org-config/client/owner-settings-team-actions";
import {
  openBillingUpgradeSupport,
  openBillingUpgradeToPaidSupport,
} from "@/features/billing/client/billing-upgrade-support";
import {
  formatPeriodEndLabel,
  formatPlanPriceLabel,
  formatSubscriptionStatusLabel,
  formatSubscriptionStatusTone,
  formatTrialDaysRemainingLabel,
  formatUsageRatio,
  isUsageOverLimit,
  pickLocalizedFeatureLabel,
  pickLocalizedPlanName,
} from "@/features/billing/client/subscription-display";
import { countEmployeeSeats } from "@/features/billing/client/entitlement-guards";
import { text } from "./prototype-runtime-demo-data";
import { OwnerSettingsDeleteDialog } from "./owner-settings-delete-dialog-ui";
import {
  Badge,
  SettingToggle,
  SettingsLink,
  SettingsPageHeader,
} from "./owner-settings-ui-primitives";
import { ThemePicker } from "./prototype-runtime-notebook";
import { OwnerSettingsTeamInvites } from "./owner-settings-team-invites";

export function OwnerSettingsAccountSection({
  lang,
  draftOwnerName,
  setDraftOwnerName,
  draftAuthOwnerUsername,
  setDraftAuthOwnerUsername,
  draftAuthOwnerPassword,
  setDraftAuthOwnerPassword,
  ownerProfileDirty,
  authDirty,
  saveOwnerProfile,
  saveAuthCredentials,
  settingsNotice,
  settingsSuccess,
  setSection,
}) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <SettingsPageHeader title={text(lang, "myAccountSecurity")} onBack={() => setSection("home")} lang={lang} />
      <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "ownerFullName")}</p>
        <input value={draftOwnerName} onChange={(event) => setDraftOwnerName(event.target.value)} maxLength={80} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
        <p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "ownerRenameProfileHint")}</p>
        <button disabled={!ownerProfileDirty} onClick={saveOwnerProfile} className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${ownerProfileDirty ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{text(lang, "saveAccountSettings")}</button>
      </div>
      <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "بيانات دخول المالك" : "Owner login credentials"}</p>
        <input dir="ltr" value={draftAuthOwnerUsername} onChange={(event) => setDraftAuthOwnerUsername(event.target.value)} placeholder={lang === "ar" ? "اسم المستخدم" : "Username"} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
        <input dir="ltr" type="password" value={draftAuthOwnerPassword} onChange={(event) => setDraftAuthOwnerPassword(event.target.value)} placeholder={lang === "ar" ? "كلمة المرور" : "Password"} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
        <p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{lang === "ar" ? "يتم حفظها في إعدادات التشغيل على الخادم ويمكن تعديلها لاحقًا." : "Stored in server runtime settings and can be changed later."}</p>
        <button disabled={!authDirty && !ownerProfileDirty} onClick={saveAuthCredentials} className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${authDirty || ownerProfileDirty ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{lang === "ar" ? "حفظ بيانات الدخول" : "Save login credentials"}</button>
        {settingsNotice && <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>}
        {settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}
      </div>
    </motion.section>
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
}) {
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <SettingsPageHeader title={lang === "ar" ? "المحلات" : "Shops"} onBack={() => setSection("home")} lang={lang} />
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-[#716753]">{text(lang, "activeStores")}</p>
        <button onClick={() => setShowAddStore(!showAddStore)} className="flex items-center gap-1 text-taq-meta font-black text-[#9A823E]"><Plus className="h-3.5 w-3.5" />{text(lang, "addStore")}</button>
      </div>
      {showAddStore && (
        <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
          <input value={newStoreName} onChange={(event) => setNewStoreName(event.target.value)} placeholder={text(lang, "newStoreName")} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" />
          <input value={newStoreLocation} onChange={(event) => setNewStoreLocation(event.target.value)} placeholder={text(lang, "newStoreLocation")} className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" />
          <button onClick={addStore} className="w-full rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "confirmAddStore")}</button>
        </div>
      )}
      <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        {activeStoredBusinesses.length ? activeStoredBusinesses.map((business, index) => (
          <button key={business.id} onClick={() => openStore(business.id)} className={`flex w-full items-center justify-between px-4 py-4 text-start ${index < activeStoredBusinesses.length - 1 ? "border-b border-[#F0ECE2]" : ""}`}>
            <div>
              <p className="text-xs font-black">{displayBusinessName(business)}</p>
              <p className="mt-1 text-taq-meta font-bold text-[#827762]">{displayLocation(business)} <span className="text-[#257844]">{text(lang, "storeActive")}</span></p>
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
      <OwnerSettingsDeleteDialog {...deleteDialogProps} />
    </motion.section>
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
}) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <SettingsPageHeader title={lang === "ar" ? "الفريق والصلاحيات" : "Team & access"} onBack={() => { cancelManagingTeam(); setSection("home"); }} lang={lang} />
      {inviteApiContext?.organizationId && inviteApiContext?.actorUserId ? (
        <OwnerSettingsTeamInvites
          lang={lang}
          organizationId={inviteApiContext.organizationId}
          actorUserId={inviteApiContext.actorUserId}
          actorRole={inviteApiContext.actorRole || "owner"}
          activeStoredBusinesses={activeStoredBusinesses}
          displayBusinessName={displayBusinessName}
        />
      ) : null}
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
                  {person.active ? text(lang, "active") : text(lang, "stopChannel")} {employeeStoreIds(person).length} {lang === "ar" ? "محل" : "shop(s)"}
                </p>
                {person.mobile ? (
                  <p className="mt-1 text-taq-meta font-bold text-[#716753]" dir="ltr">
                    {text(lang, "employeeMobile")}: {formatLoginPhoneForDisplay(person.mobile)}
                  </p>
                ) : (
                  <p className="mt-1 text-taq-meta font-bold text-[#B8A98E]">
                    {text(lang, "employeeMobileMissing")}
                  </p>
                )}
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
                  <p className="mb-2 text-xs font-black text-[#716753]">{text(lang, "employeeMobile")}</p>
                  <LoginPhoneFields
                    value={person.mobile || ""}
                    onChange={(nextValue) => updateEmployeeMobile(person.id, nextValue)}
                    dialClassName="w-24 rounded-2xl bg-[#F7F5EF] px-3 py-3 text-xs font-black outline-none"
                    nationalClassName="min-w-0 flex-1 rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none"
                    containerClassName="flex gap-2"
                  />
                </div>
                <div className="mt-3">
                  <p className="mb-2 text-xs font-black text-[#716753]">{lang === "ar" ? "الرقم السري للموظف" : "Employee PIN"}</p>
                  <input dir="ltr" value={draftAuthEmployeePins?.[person.id] || ""} onChange={(event) => updateDraftEmployeePin(person.id, event.target.value)} placeholder={lang === "ar" ? "PIN أو كلمة مرور قصيرة" : "PIN or short passcode"} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
                </div>
              </>
            )}
          </div>
        ))}
        {managingTeam && (
          <div className="p-4">
            <p className="mb-3 text-xs font-black">{text(lang, "addEmployee")}</p>
            <input value={newEmployeeName} onChange={(event) => setNewEmployeeName(event.target.value)} placeholder={text(lang, "newEmployeeName")} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none" />
            <div className="mb-3">
              <p className="mb-2 text-xs font-black text-[#716753]">{text(lang, "employeeMobile")}</p>
              <LoginPhoneFields
                value={newEmployeeMobile}
                onChange={setNewEmployeeMobile}
                dialClassName="w-24 rounded-2xl bg-[#F7F5EF] px-3 py-3 text-xs font-black outline-none"
                nationalClassName="min-w-0 flex-1 rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-bold outline-none"
                containerClassName="flex gap-2"
              />
            </div>
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
      <OwnerSettingsDeleteDialog {...deleteDialogProps} />
    </motion.section>
  );
}

export function OwnerSettingsAppearanceSection({
  lang,
  draftNotebookTheme,
  setDraftNotebookTheme,
  notebookTheme,
  themeDirty,
  setThemeDirty,
  setNotebookTheme,
  showSettingsSaved,
  settingsSuccess,
  setSection,
}) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <SettingsPageHeader title={text(lang, "notebookAppearance")} onBack={() => setSection("home")} lang={lang} />
      <div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <p className="mb-2 text-taq-meta font-bold text-[#827762]">{lang === "ar" ? "اختر شكل دفتر التقفيلة والتقارير وصور المشاركة." : "Choose the notebook style for closeouts, reports, and sharing."}</p>
        <ThemePicker lang={lang} theme={draftNotebookTheme} onChange={(nextTheme) => { setDraftNotebookTheme(nextTheme); setThemeDirty(isNotebookThemeDirty(nextTheme, notebookTheme)); }} />
        <p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">{text(lang, "autoSavedAccount")}</p>
        {themeDirty && (
          <div className="mt-4 grid grid-cols-[0.9fr_1.35fr] gap-3">
            <button onClick={() => { setDraftNotebookTheme(notebookTheme); setThemeDirty(false); }} className="rounded-2xl bg-[#F7F5EF] py-3 text-xs font-black">{text(lang, "cancelChanges")}</button>
            <button onClick={() => { setNotebookTheme(draftNotebookTheme); setThemeDirty(false); showSettingsSaved(); }} className="rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "saveSettings")}</button>
          </div>
        )}
        {settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}
      </div>
    </motion.section>
  );
}

function SubscriptionUsageMeter({ label, used, max, lang }) {
  const overLimit = isUsageOverLimit(used, max);
  const percent = formatUsageRatio(used, max);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-taq-meta font-bold text-[#716753]">
        <span>{label}</span>
        <span className={overLimit ? "text-[#B44747]" : ""}>{used} / {max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F0ECE2]">
        <div
          className={`h-full rounded-full transition-all ${overLimit ? "bg-[#B44747]" : "bg-[#112A46]"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {overLimit ? (
        <p className="text-taq-meta font-bold text-[#B44747]">
          {lang === "ar" ? "تجاوزت حد الخطة الحالية" : "Over current plan limit"}
        </p>
      ) : null}
    </div>
  );
}

export function OwnerSettingsSubscriptionSection({
  lang,
  setSection,
  entitlements,
  entitlementsLoading,
  entitlementsError,
  reloadEntitlements,
  ownerProfile,
  onOpenSupport,
}) {
  const planName = pickLocalizedPlanName(entitlements, lang);
  const statusLabel = formatSubscriptionStatusLabel(
    entitlements?.subscriptionStatus || entitlements?.organizationStatus,
    lang,
  );
  const statusTone = formatSubscriptionStatusTone(
    entitlements?.subscriptionStatus,
    entitlements?.organizationStatus,
  );
  const employeeSeatsUsed = countEmployeeSeats(entitlements?.usage);

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <SettingsPageHeader title={text(lang, "subscriptionDetails")} onBack={() => setSection("home")} lang={lang} />
      {entitlementsLoading ? (
        <div className="rounded-3xl bg-white p-5 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-black/[0.045]">
          {text(lang, "subscriptionLoading")}
        </div>
      ) : null}
      {entitlementsError ? (
        <div className="mb-4 rounded-3xl bg-[#FFF1EE] p-4 text-center ring-1 ring-black/[0.045]">
          <p className="text-taq-meta font-bold text-[#B44747]">{entitlementsError}</p>
          <button type="button" onClick={() => { void reloadEntitlements(); }} className="mt-3 rounded-2xl bg-[#112A46] px-4 py-2.5 text-taq-meta font-black text-white">
            {text(lang, "retryLoad")}
          </button>
        </div>
      ) : null}
      {entitlements ? (
        <>
          {entitlements.isTrialPlan ? (
            <div className="mb-4 rounded-3xl bg-[#FFF4D2] p-5 ring-1 ring-[#F0D9A2]">
              <Badge tone="warning">{text(lang, "trialPlanBadge")}</Badge>
              <p className="mt-3 text-sm font-black text-[#806528]">{text(lang, "trialPlanTitle")}</p>
              <p className="mt-2 text-taq-meta font-bold leading-6 text-[#806528]">{text(lang, "trialPlanDescription")}</p>
              <p className="mt-3 text-taq-meta font-bold text-[#806528]">
                {text(lang, "trialDaysRemaining")}: {formatTrialDaysRemainingLabel(entitlements.trialDaysRemaining, lang)}
              </p>
              <button
                type="button"
                onClick={() => openBillingUpgradeToPaidSupport({
                  ownerName: ownerProfile?.name || "",
                  currentPlanName: planName,
                })}
                className="mt-4 w-full rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white"
              >
                {text(lang, "upgradeToPaid")}
              </button>
            </div>
          ) : null}
          <div className="mb-4 rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="navy">{text(lang, "currentPlan")}</Badge>
              {entitlements.isTrialPlan ? <Badge tone="warning">{text(lang, "trialPlanBadge")}</Badge> : null}
              <Badge tone={statusTone}>{statusLabel}</Badge>
            </div>
            <h3 className="mt-4 text-lg font-black">{planName}</h3>
            <p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">
              {formatPlanPriceLabel(entitlements.priceMonthlyHalalas, lang, { isTrialPlan: entitlements.isTrialPlan })}
            </p>
            <p className="mt-3 text-taq-meta font-bold text-[#827762]">
              {entitlements.isTrialPlan
                ? `${text(lang, "trialEndsOn")}: ${formatPeriodEndLabel(entitlements.currentPeriodEnd, lang)}`
                : `${text(lang, "renewalDate")}: ${formatPeriodEndLabel(entitlements.currentPeriodEnd, lang)}`}
            </p>
            <div className="mt-5 space-y-4">
              <SubscriptionUsageMeter
                label={lang === "ar" ? "المحلات" : "Stores"}
                used={entitlements.usage.activeStores}
                max={entitlements.maxStores}
                lang={lang}
              />
              <SubscriptionUsageMeter
                label={lang === "ar" ? "الموظفون والدعوات" : "Employees & invites"}
                used={employeeSeatsUsed}
                max={entitlements.maxEmployees}
                lang={lang}
              />
            </div>
          </div>
          <div className="mb-4 rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]">
            <p className="text-xs font-bold text-[#716753]">{text(lang, "planFeatures")}</p>
            <ul className="mt-3 space-y-2">
              {entitlements.features.map((feature) => (
                <li key={feature.key} className="rounded-2xl bg-[#F7F5EF] px-4 py-3 text-taq-meta font-bold text-[#112A46]">
                  {pickLocalizedFeatureLabel(feature, lang)}
                </li>
              ))}
            </ul>
          </div>
          {entitlements.upgradePlans.length ? (
            <div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]">
              <p className="text-xs font-bold text-[#716753]">{text(lang, "upgradeOptions")}</p>
              <div className="mt-3 space-y-3">
                {entitlements.upgradePlans.map((plan) => (
                  <div key={plan.planCode} className="rounded-2xl border border-[#F0ECE2] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{lang === "ar" ? plan.displayNameAr : plan.displayNameEn}</p>
                        <p className="mt-1 text-taq-meta font-bold text-[#827762]">
                          {formatPlanPriceLabel(plan.priceMonthlyHalalas, lang)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openBillingUpgradeSupport({
                          ownerName: ownerProfile?.name || "",
                          currentPlanName: planName,
                          targetPlanName: lang === "ar" ? plan.displayNameAr : plan.displayNameEn,
                        })}
                        className="shrink-0 rounded-2xl bg-[#112A46] px-3 py-2 text-taq-meta font-black text-white"
                      >
                        {text(lang, "requestUpgrade")}
                      </button>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {plan.features.map((feature) => (
                        <li key={`${plan.planCode}-${feature.key}`} className="text-taq-meta font-bold text-[#716753]">
                          • {pickLocalizedFeatureLabel(feature, lang)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-2xl bg-[#FFF4D2] p-3 text-taq-meta font-bold leading-5 text-[#806528]">
                {text(lang, "upgradeSupportHint")}
              </p>
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]">
              <p className="text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "topPlanHint")}</p>
              <button type="button" onClick={onOpenSupport} className="mt-4 w-full rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">
                {text(lang, "contactSupport")}
              </button>
            </div>
          )}
        </>
      ) : null}
    </motion.section>
  );
}

export function OwnerSettingsSupportSection({ lang, setSection, onOpenSupport, onOpenHelp }) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <SettingsPageHeader title={text(lang, "support")} onBack={() => setSection("home")} lang={lang} />
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <SettingsLink lang={lang} icon={Smartphone} title={text(lang, "whatsappSupport")} onClick={onOpenSupport} border />
        <SettingsLink lang={lang} icon={FileText} title={text(lang, "helpCenter")} onClick={onOpenHelp} border={false} />
      </div>
    </motion.section>
  );
}

export function OwnerSettingsHomeSection({
  lang,
  ownerProfile,
  activeStoredBusinesses,
  visibleStaff,
  notebookTheme,
  setSection,
  onLogout,
  entitlements,
  entitlementsLoading,
}) {
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  const storeCountLabel = entitlements
    ? String(entitlements.usage.activeStores)
    : String(activeStoredBusinesses.length);
  const teamCountLabel = entitlements
    ? String(countEmployeeSeats(entitlements.usage))
    : String(visibleStaff.length);
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      <div className="mb-5">
        <p className="text-xs font-bold text-[#8B8274]">{text(lang, "ownerAccount")}</p>
        <h1 className="text-xl font-black">{text(lang, "settings")}</h1>
      </div>
      <button onClick={() => setSection("account")} className="mb-5 flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-start ring-1 ring-black/[0.045]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#112A46] text-white"><UserRound className="h-6 w-6" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{ownerProfile?.name || (lang === "ar" ? "المالك" : "Owner")}</p>
          <p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "myAccountSecurity")}</p>
        </div>
        <Arrow className="h-4 w-4 shrink-0 text-[#B99844]" />
      </button>
      <p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "المنشأة" : "Organization"}</p>
      <div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <SettingsLink lang={lang} icon={Building2} title={lang === "ar" ? "المحلات" : "Shops"} value={storeCountLabel} onClick={() => setSection("stores")} />
        <SettingsLink lang={lang} icon={UserRound} title={lang === "ar" ? "الفريق والصلاحيات" : "Team & access"} value={teamCountLabel} onClick={() => setSection("team")} />
        <SettingsLink
          lang={lang}
          icon={CreditCard}
          title={text(lang, "subscriptionDetails")}
          value={
            entitlementsLoading
              ? text(lang, "subscriptionLoading")
              : (entitlements?.isTrialPlan
                ? text(lang, "trialPlanBadge")
                : (pickLocalizedPlanName(entitlements, lang) || text(lang, "subscription")))
          }
          onClick={() => setSection("subscription")}
          border={false}
        />
      </div>
      <p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "التفضيلات" : "Preferences"}</p>
      <div className="mb-5 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <SettingsLink lang={lang} icon={ReceiptText} title={text(lang, "notebookAppearance")} value={text(lang, notebookTheme)} onClick={() => setSection("appearance")} border={false} />
      </div>
      <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "support")}</p>
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <SettingsLink lang={lang} icon={Smartphone} title={text(lang, "contactSupport")} onClick={() => setSection("support")} />
        <SettingsLink lang={lang} icon={UserRound} title={text(lang, "logout")} onClick={onLogout} danger border={false} />
      </div>
      <ReleaseVersionLine
        className="mt-6 text-center text-taq-meta font-bold text-[#A99D87]"
        lang={lang}
        showBuild
      />
    </motion.section>
  );
}

export function renderOwnerSettingsSection(section, state, callbacks) {
  const { onLogout, onOpenSupport, onOpenHelp } = callbacks;
  const common = { lang: state.lang, setSection: state.setSection };

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
      />
    );
  }
  if (section === "stores") {
    return (
      <OwnerSettingsStoresSection
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
      />
    );
  }
  if (section === "team") {
    return (
      <OwnerSettingsTeamSection
        {...common}
        managingTeam={state.managingTeam}
        startManagingTeam={state.startManagingTeam}
        cancelManagingTeam={state.cancelManagingTeam}
        visibleStaff={state.visibleStaff}
        employeeStoreIds={state.employeeStoreIds}
        toggleEmployeeActive={state.toggleEmployeeActive}
        setDeleteTarget={state.setDeleteTarget}
        activeStoredBusinesses={state.activeStoredBusinesses}
        displayBusinessName={state.displayBusinessName}
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
        deleteDialogProps={state.deleteDialogProps}
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
      <OwnerSettingsSubscriptionSection
        {...common}
        entitlements={state.entitlements}
        entitlementsLoading={state.entitlementsLoading}
        entitlementsError={state.entitlementsError}
        reloadEntitlements={state.reloadEntitlements}
        ownerProfile={state.ownerProfile}
        onOpenSupport={onOpenSupport}
      />
    );
  }
  if (section === "support") {
    return (
      <OwnerSettingsSupportSection
        {...common}
        onOpenSupport={onOpenSupport}
        onOpenHelp={onOpenHelp}
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
