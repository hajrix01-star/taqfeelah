"use client";

import React from "react";
import { Mail, Phone } from "lucide-react";
import { ownerPasswordInputProps } from "@/features/auth/client/auth-gate/owner-password-input-props";
import { useOwnerPasswordChangeForm } from "@/features/auth/client/auth-gate/use-owner-password-change-form";
import { text } from "./taqfeelah-app-reference-data";
import { SettingsPageHeader } from "./owner-settings-ui-primitives";
import { SettingsSectionFrame } from "./owner-settings-section-frame";
import type {
  DisplayLang,
  OwnerSettingsSectionCommonProps,
} from "./taqfeelah-app-types";

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
