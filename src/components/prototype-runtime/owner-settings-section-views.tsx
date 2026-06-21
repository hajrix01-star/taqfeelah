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
  Mail,
  Phone,
  Plus,
  ReceiptText,
  Smartphone,
  UserRound,
} from "lucide-react";
import { isNotebookThemeDirty } from "@/features/org-config/client/owner-settings-appearance-actions";
import { formatOrganizationAccountNumber } from "@/features/billing/client/format-organization-account-number";
import {
  formatBillingCycleLabel,
  formatPlanSubscriptionHomeLabel,
  formatPeriodEndLabel,
  formatPlanPriceLabel,
  formatRenewalDaysRemainingLabel,
  formatSubscriptionStatusLabel,
  formatSubscriptionStatusTone,
  formatTrialDaysRemainingLabel,
  formatUsageRatio,
  isUsageOverLimit,
  pickLocalizedFeatureLabel,
  pickLocalizedPlanName,
} from "@/features/billing/client/subscription-display";
import { SubscriptionRenewalBanner } from "@/features/billing/client/SubscriptionRenewalBanner";
import {
  canAddStore,
  countEmployeeSeats,
  resolveStoreLimitMessage,
} from "@/features/billing/client/entitlement-guards";
import { ownerPasswordInputProps } from "@/features/auth/client/auth-gate/owner-password-input-props";
import { useOwnerPasswordChangeForm } from "@/features/auth/client/auth-gate/use-owner-password-change-form";
import { text } from "./prototype-runtime-demo-data";
import { OwnerSettingsDeleteDialog } from "./owner-settings-delete-dialog-ui";
import {
  Badge,
  SettingToggle,
  SettingsLink,
  SettingsPageHeader,
} from "./owner-settings-ui-primitives";
import { ThemePicker } from "./prototype-runtime-notebook";
import { OwnerSettingsTeamSectionWithInvites } from "./owner-settings-team-section-with-invites";
import { OwnerSettingsTeamRoster } from "./owner-settings-team-roster";
import type {
  DisplayLang,
  OwnerSettingsDeleteDialogProps,
  OwnerSettingsSectionCommonProps,
  OwnerSettingsSectionRenderOptions,
  OwnerSettingsTabbedShellCallbacks,
  OwnerSettingsViewState,
  PrototypeBusiness,
} from "./prototype-runtime-types";
import type { StaffMember } from "@/features/org-config/client/org-config-client-types";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/client/billing-client-types";

function SettingsSectionFrame({ embedded, children }: { embedded?: boolean; children: React.ReactNode }) {
  if (embedded) return children;
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter pb-24">
      {children}
    </motion.section>
  );
}

function OwnerAccountReadOnlyField({ label, value, dir = "ltr" }: { label: React.ReactNode; value: React.ReactNode; dir?: "ltr" | "rtl" }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="mb-2 text-xs font-bold text-[#716753]">{label}</p>
      <div dir={dir} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black text-[#112A46]">
        {value}
      </div>
    </div>
  );
}

function OwnerSettingsAccountPasswordPanel({ lang, onPasswordChanged }: { lang: DisplayLang; onPasswordChanged: () => void }) {
  const form = useOwnerPasswordChangeForm({
    lang,
    onComplete: onPasswordChanged,
  });

  return (
    <div className="mt-4 space-y-2 border-t border-black/[0.06] pt-4">
      <input
        dir="ltr"
        type="password"
        value={form.currentPassword}
        onChange={(event) => form.setCurrentPassword(event.target.value)}
        autoComplete="current-password"
        placeholder={text(lang, "ownerAccountCurrentPassword")}
        {...ownerPasswordInputProps}
        className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
      />
      <input
        dir="ltr"
        type="password"
        value={form.newPassword}
        onChange={(event) => form.setNewPassword(event.target.value)}
        autoComplete="new-password"
        placeholder={text(lang, "ownerAccountNewPassword")}
        {...ownerPasswordInputProps}
        className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
      />
      <input
        dir="ltr"
        type="password"
        value={form.confirmPassword}
        onChange={(event) => form.setConfirmPassword(event.target.value)}
        autoComplete="new-password"
        placeholder={text(lang, "ownerAccountConfirmPassword")}
        {...ownerPasswordInputProps}
        className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
      />
      {form.error ? (
        <p className="rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{form.error}</p>
      ) : null}
      <button
        type="button"
        disabled={form.submitting}
        onClick={() => { void form.submit(); }}
        className={`w-full rounded-2xl py-3.5 text-xs font-black text-white ${form.submitting ? "bg-[#B8C0B7]" : "bg-[#112A46]"}`}
      >
        {text(lang, "ownerAccountChangePassword")}
      </button>
    </div>
  );
}


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
  embedded = false,
  serverAuthMode = false,
  ownerAccount = null,
  ownerAccountLoading = false,
  ownerAccountError = "",
  reloadOwnerAccount = () => {},
}: OwnerSettingsSectionCommonProps & {
  draftOwnerName: string;
  setDraftOwnerName: (value: string) => void;
  draftAuthOwnerUsername: string;
  setDraftAuthOwnerUsername: (value: string) => void;
  draftAuthOwnerPassword: string;
  setDraftAuthOwnerPassword: (value: string) => void;
  ownerProfileDirty: boolean;
  authDirty: boolean;
  saveOwnerProfile: () => void;
  saveAuthCredentials: () => void;
  settingsNotice: string;
  settingsSuccess: boolean;
  serverAuthMode?: boolean;
  ownerAccount?: Record<string, unknown> | null;
  ownerAccountLoading?: boolean;
  ownerAccountError?: string;
  reloadOwnerAccount?: () => void;
}) {
  const [showPasswordPanel, setShowPasswordPanel] = React.useState(false);
  const [passwordChangedNotice, setPasswordChangedNotice] = React.useState(false);

  const handlePasswordChanged = React.useCallback(() => {
    setPasswordChangedNotice(true);
    setShowPasswordPanel(false);
  }, []);

  if (serverAuthMode) {
    const email = String(ownerAccount?.email || text(lang, "ownerAccountNotAvailable"));
    const phone = String(ownerAccount?.loginPhoneDisplay || text(lang, "ownerAccountNotAvailable"));

    return (
      <SettingsSectionFrame embedded={embedded}>
        {!embedded ? (
          <SettingsPageHeader title={text(lang, "myAccountSecurity")} onBack={() => setSection("home")} lang={lang} />
        ) : null}

        <div className={`${embedded ? "" : "mb-5 "}rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]`}>
          <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "ownerFullName")}</p>
          <input value={draftOwnerName} onChange={(event) => setDraftOwnerName(event.target.value)} maxLength={80} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
          <button disabled={!ownerProfileDirty} onClick={saveOwnerProfile} className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${ownerProfileDirty ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{text(lang, "saveAccountSettings")}</button>
        </div>

        <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
          <div className="mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#B99844]" />
            <p className="text-xs font-bold text-[#716753]">{text(lang, "ownerAccountContactTitle")}</p>
          </div>
          {ownerAccountLoading ? (
            <p className="text-taq-meta font-bold text-[#827762]">{text(lang, "ownerAccountLoading")}</p>
          ) : null}
          {ownerAccountError ? (
            <div className="rounded-2xl bg-[#FFF1EE] p-3 text-center">
              <p className="text-taq-meta font-bold text-[#B44747]">{ownerAccountError}</p>
              <button
                type="button"
                onClick={() => { void reloadOwnerAccount(); }}
                className="mt-3 rounded-2xl bg-[#112A46] px-4 py-2.5 text-taq-meta font-black text-white"
              >
                {text(lang, "retryLoad")}
              </button>
            </div>
          ) : null}
          {!ownerAccountLoading && !ownerAccountError ? (
            <>
              <OwnerAccountReadOnlyField label={text(lang, "ownerAccountEmail")} value={email} />
              <OwnerAccountReadOnlyField label={text(lang, "ownerAccountPhone")} value={phone} />
              <p className="mt-2 text-taq-meta font-bold leading-6 text-[#827762]">
                {text(lang, "ownerAccountContactHint")}
              </p>
            </>
          ) : null}
        </div>

        <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
          <div className="mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#B99844]" />
            <p className="text-xs font-bold text-[#716753]">{text(lang, "ownerAccountLoginTitle")}</p>
          </div>
          <p className="text-taq-meta font-bold leading-6 text-[#827762]">{text(lang, "ownerAccountLoginHint")}</p>
          <button
            type="button"
            onClick={() => setShowPasswordPanel((current) => !current)}
            className="mt-4 w-full rounded-2xl bg-[#F7F5EF] py-3.5 text-xs font-black text-[#112A46]"
          >
            {text(lang, "ownerAccountChangePassword")}
          </button>
          {showPasswordPanel ? (
            <OwnerSettingsAccountPasswordPanel lang={lang} onPasswordChanged={handlePasswordChanged} />
          ) : null}
          {passwordChangedNotice ? (
            <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">
              {text(lang, "ownerAccountPasswordChanged")}
            </div>
          ) : null}
        </div>

        {settingsNotice && <p className="rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>}
        {settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}
      </SettingsSectionFrame>
    );
  }

  return (
    <SettingsSectionFrame embedded={embedded}>
      {!embedded ? (
        <SettingsPageHeader title={text(lang, "myAccountSecurity")} onBack={() => setSection("home")} lang={lang} />
      ) : null}
      <div className={`${embedded ? "" : "mb-5 "}rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]`}>
        <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "ownerFullName")}</p>
        <input value={draftOwnerName} onChange={(event) => setDraftOwnerName(event.target.value)} maxLength={80} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
        <button disabled={!ownerProfileDirty} onClick={saveOwnerProfile} className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${ownerProfileDirty ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{text(lang, "saveAccountSettings")}</button>
      </div>
      <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveAuthCredentials();
          }}
          autoComplete="on"
        >
          <p className="mb-2 text-xs font-bold text-[#716753]">{lang === "ar" ? "بيانات دخول المالك" : "Owner login credentials"}</p>
          <input dir="ltr" name="username" value={draftAuthOwnerUsername} onChange={(event) => setDraftAuthOwnerUsername(event.target.value)} autoComplete="username" placeholder={lang === "ar" ? "اسم المستخدم" : "Username"} className="mb-2 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
          <input dir="ltr" name="password" type="password" value={draftAuthOwnerPassword} onChange={(event) => setDraftAuthOwnerPassword(event.target.value)} autoComplete="new-password" placeholder={lang === "ar" ? "كلمة المرور" : "Password"} {...ownerPasswordInputProps} className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none" />
          <button type="submit" disabled={!authDirty && !ownerProfileDirty} className={`mt-5 w-full rounded-2xl py-3.5 text-xs font-black text-white ${authDirty || ownerProfileDirty ? "bg-[#112A46]" : "bg-[#B8C0B7]"}`}>{lang === "ar" ? "حفظ بيانات الدخول" : "Save login credentials"}</button>
          {settingsNotice && <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{settingsNotice}</p>}
          {settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}
        </form>
      </div>
    </SettingsSectionFrame>
  );
}

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
  embedded = false,
}: OwnerSettingsSectionCommonProps & {
  draftNotebookTheme: string;
  setDraftNotebookTheme: (value: string) => void;
  notebookTheme: string;
  themeDirty: boolean;
  setThemeDirty: (value: boolean) => void;
  setNotebookTheme: (value: string) => void;
  showSettingsSaved: () => void;
  settingsSuccess: boolean;
}) {
  return (
    <SettingsSectionFrame embedded={embedded}>
      {!embedded ? (
        <SettingsPageHeader title={text(lang, "notebookAppearance")} onBack={() => setSection("home")} lang={lang} />
      ) : null}
      <div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <ThemePicker lang={lang} theme={draftNotebookTheme} onChange={(nextTheme) => { setDraftNotebookTheme(nextTheme); setThemeDirty(isNotebookThemeDirty(nextTheme, notebookTheme)); }} />
        {themeDirty && (
          <div className="mt-4 grid grid-cols-[0.9fr_1.35fr] gap-3">
            <button onClick={() => { setDraftNotebookTheme(notebookTheme); setThemeDirty(false); }} className="rounded-2xl bg-[#F7F5EF] py-3 text-xs font-black">{text(lang, "cancelChanges")}</button>
            <button onClick={() => { setNotebookTheme(draftNotebookTheme); setThemeDirty(false); showSettingsSaved(); }} className="rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "saveSettings")}</button>
          </div>
        )}
        {settingsSuccess && <div className="mt-4 rounded-xl bg-[#E6F5E9] p-3 text-center text-taq-meta font-black text-[#257844]">{text(lang, "changesSaved")}</div>}
      </div>
    </SettingsSectionFrame>
  );
}

function SubscriptionUsageMeter({ label, used, max, lang }: { label: React.ReactNode; used: number; max: number; lang: DisplayLang }) {
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
  embedded = false,
  hideUpgradeActions = false,
}: OwnerSettingsSectionCommonProps & {
  entitlements: ResolvedOrganizationEntitlements | null;
  entitlementsLoading: boolean;
  entitlementsError: string;
  reloadEntitlements: () => void | Promise<void>;
  ownerProfile: Record<string, unknown>;
  onOpenSupport?: () => void;
  hideUpgradeActions?: boolean;
}) {
  const planName = pickLocalizedPlanName(entitlements, lang);
  const statusLabel = formatSubscriptionStatusLabel(
    entitlements?.subscriptionStatus || entitlements?.organizationStatus,
    lang,
    { isTrialPlan: Boolean(entitlements?.isTrialPlan) },
  );
  const statusTone = formatSubscriptionStatusTone(
    entitlements?.subscriptionStatus,
    entitlements?.organizationStatus,
  );
  const employeeSeatsUsed = countEmployeeSeats(entitlements?.usage);

  return (
    <SettingsSectionFrame embedded={embedded}>
      {!embedded ? (
        <SettingsPageHeader title={text(lang, "subscriptionDetails")} onBack={() => setSection("home")} lang={lang} />
      ) : null}
      {entitlements ? (
        <SubscriptionRenewalBanner
          lang={lang}
          entitlements={entitlements}
          ownerName={String(ownerProfile?.name || "")}
          className="mb-4"
        />
      ) : null}
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
              <p className="mt-3 text-taq-meta font-bold text-[#806528]">
                {text(lang, "trialDaysRemaining")}: {formatTrialDaysRemainingLabel(entitlements.trialDaysRemaining, lang)}
              </p>
              {hideUpgradeActions ? (
                <p className="mt-3 text-taq-meta font-bold text-[#806528]">
                  {lang === "ar" ? "لترقية الخطة اضغط اسم خطتك أعلى الإعدادات." : "Tap your plan name at the top of Settings to upgrade."}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="mb-4 rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="navy">{text(lang, "currentPlan")}</Badge>
              {entitlements.isTrialPlan ? <Badge tone="warning">{text(lang, "trialPlanBadge")}</Badge> : null}
              <Badge tone={statusTone}>{statusLabel}</Badge>
            </div>
            <h3 className="mt-4 text-lg font-black">{planName}</h3>
            {Number.isInteger(entitlements.accountNumber) ? (
              <p className="mt-2 text-taq-meta font-bold text-[#827762]" dir="ltr">
                {lang === "ar" ? "رقم الحساب: " : "Account no.: "}
                {formatOrganizationAccountNumber(entitlements.accountNumber)}
              </p>
            ) : null}
            <p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">
              {formatPlanPriceLabel(entitlements.priceMonthlyHalalas, lang, {
                isTrialPlan: entitlements.isTrialPlan,
                billingCycle: entitlements.billingCycle,
                priceYearlyHalalas: entitlements.priceYearlyHalalas,
              })}
            </p>
            <p className="mt-2 text-taq-meta font-bold text-[#827762]">
              {text(lang, "billingCycleLabel")}: {formatBillingCycleLabel(entitlements.billingCycle, lang)}
            </p>
            <p className="mt-2 text-taq-meta font-bold text-[#827762]">
              {entitlements.isTrialPlan
                ? `${text(lang, "trialDaysRemaining")}: ${formatTrialDaysRemainingLabel(entitlements.trialDaysRemaining, lang)}`
                : `${text(lang, "renewalDaysRemaining")}: ${formatRenewalDaysRemainingLabel(entitlements.renewalDaysRemaining, lang)}`}
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
          {entitlements.upgradePlans.length && !hideUpgradeActions ? (
            <div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]">
              <p className="text-xs font-bold text-[#716753]">{text(lang, "upgradeOptions")}</p>
              <div className="mt-3 space-y-3">
                {entitlements.upgradePlans.map((plan) => (
                  <div key={plan.planCode} className="rounded-2xl border border-[#F0ECE2] p-4">
                    <div>
                      <p className="text-sm font-black">{lang === "ar" ? plan.displayNameAr : plan.displayNameEn}</p>
                      <p className="mt-1 text-taq-meta font-bold text-[#827762]">
                        {formatPlanPriceLabel(plan.priceMonthlyHalalas, lang)}
                      </p>
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
            </div>
          ) : null}
          {!hideUpgradeActions && !entitlements.upgradePlans.length ? (
            <div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]">
              <button type="button" onClick={onOpenSupport} className="w-full rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">
                {text(lang, "contactSupport")}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </SettingsSectionFrame>
  );
}

export function OwnerSettingsSupportSection({
  lang,
  setSection,
  onOpenSupport,
  onOpenHelp,
  embedded = false,
  entitlements = null,
  entitlementsLoading = false,
  entitlementsError = "",
  reloadEntitlements = () => {},
  ownerProfile = null,
}: OwnerSettingsSectionCommonProps & {
  onOpenSupport?: () => void;
  onOpenHelp?: () => void;
  entitlements?: ResolvedOrganizationEntitlements | null;
  entitlementsLoading?: boolean;
  entitlementsError?: string;
  reloadEntitlements?: () => void | Promise<void>;
  ownerProfile?: Record<string, unknown> | null;
}) {
  return (
    <SettingsSectionFrame embedded={embedded}>
      {!embedded ? (
        <SettingsPageHeader title={text(lang, "support")} onBack={() => setSection("stores-team")} lang={lang} />
      ) : null}
      <OwnerSettingsSubscriptionSection
        lang={lang}
        setSection={setSection}
        entitlements={entitlements}
        entitlementsLoading={entitlementsLoading}
        entitlementsError={entitlementsError}
        reloadEntitlements={reloadEntitlements}
        ownerProfile={ownerProfile ?? {}}
        onOpenSupport={onOpenSupport}
        embedded
        hideUpgradeActions
      />
      <div className="mb-4 overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        <SettingsLink lang={lang} icon={Smartphone} title={text(lang, "whatsappSupport")} onClick={() => onOpenSupport?.()} border />
        <SettingsLink lang={lang} icon={FileText} title={text(lang, "helpCenter")} onClick={() => onOpenHelp?.()} border={false} />
      </div>
    </SettingsSectionFrame>
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
}: OwnerSettingsSectionCommonProps & {
  ownerProfile: Record<string, unknown>;
  activeStoredBusinesses: PrototypeBusiness[];
  visibleStaff: StaffMember[];
  notebookTheme: string;
  onLogout: () => void;
  entitlements: ResolvedOrganizationEntitlements | null;
  entitlementsLoading: boolean;
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
          <p className="text-sm font-black">{String(ownerProfile?.name || (lang === "ar" ? "المالك" : "Owner"))}</p>
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
              : (formatPlanSubscriptionHomeLabel(entitlements, lang) || text(lang, "subscription"))
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
