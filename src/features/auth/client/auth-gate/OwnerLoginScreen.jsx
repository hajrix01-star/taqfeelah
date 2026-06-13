"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PROTOTYPE_BUILD_STAMP } from "@/prototype-build-stamp.mjs";
import LanHintBanner from "@/features/demo/LanHintBanner";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";
import { useOwnerLoginForm } from "@/features/auth/client/auth-gate/use-owner-login-form";
import { text } from "@/components/prototype-runtime/prototype-runtime-demo-data";
import { APP_IN_PRODUCTION_MODE } from "@/components/prototype-runtime/prototype-runtime-boot";
import { usePasswordResetEnabled } from "@/features/auth/client/use-password-reset-enabled";
import { LanguageSwitch, Logo } from "@/components/prototype-runtime/prototype-runtime-chrome";
import { AppLoginPhoneField } from "@/core/phone/AppLoginPhoneField";
import { formatLoginPhoneForDisplay } from "@/core/phone/split-login-phone";

export function LoginScreen({ lang, setLang, onOwnerLogin, onEmployeePortal }) {
  const form = useOwnerLoginForm({ lang, onOwnerLogin });
  const { enabled: passwordResetEnabled, loading: passwordResetLoading } = usePasswordResetEnabled();

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter flex min-h-[800px] flex-col pb-8 pt-10">
      <div className="flex justify-end"><LanguageSwitch lang={lang} setLang={setLang} /></div>
      <div className="mt-16 flex justify-center"><Logo lang={lang} /></div>
      <div className="mt-10 text-center">
        <h1 className="text-2xl font-black text-[#112A46]">{text(lang, "loginTitle")}</h1>
        <p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-[#827762]">{text(lang, "loginSubtitle")}</p>
      </div>
      {form.showAuthMethodTabs ? (
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { form.setMethod("phone"); form.setError(""); }} className={`rounded-2xl py-2.5 text-taq-meta font-black ${form.method === "phone" ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{text(lang, "loginWithPhone")}</button>
          <button type="button" onClick={() => { form.setMethod("password"); form.setError(""); }} className={`rounded-2xl py-2.5 text-taq-meta font-black ${form.method === "password" ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{text(lang, "loginWithPassword")}</button>
        </div>
      ) : null}
      <div className="mt-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
        {form.method === "phone" && form.canUsePhoneOtp ? (
          form.stage === "phone" ? (
            <>
              <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "mobileNumber")}</p>
              <AppLoginPhoneField value={form.phone} onChange={form.setPhone} />
              <p className="mt-2 text-taq-meta font-bold text-[#827762]">{text(lang, "mobileHint")}</p>
              <button type="button" onClick={() => { form.setStage("code"); form.setError(""); }} className="mt-5 w-full rounded-2xl bg-[#112A46] py-4 text-sm font-black text-white">{text(lang, "sendCode")}</button>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-[#716753]">{text(lang, "verificationCode")}</p>
              <p className="mt-2 text-taq-meta font-bold text-[#827762]">{text(lang, "codeSentTo")} <span dir="ltr" className="text-[#112A46]">{formatLoginPhoneForDisplay(form.phone) || `+966 ${form.phone}`}</span></p>
              <input
                dir="ltr"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={form.code}
                onChange={(event) => form.setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="• • • •"
                className="mt-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-4 text-center text-xl font-black tracking-[0.45em] outline-none ring-1 ring-[#E8E1D4]"
              />
              <button type="button" onClick={form.submitOtp} className="mt-5 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white">{text(lang, "verifyContinue")}</button>
              <button type="button" onClick={() => { form.setStage("phone"); form.setError(""); }} className="mt-4 w-full text-xs font-black text-[#9A823E]">{text(lang, "changeNumber")}</button>
            </>
          )
        ) : (
          <>
            <p className="mb-2 text-xs font-bold text-[#716753]">{APP_IN_PRODUCTION_MODE ? text(lang, "mobileNumber") : text(lang, "username")}</p>
            {APP_IN_PRODUCTION_MODE ? (
              <AppLoginPhoneField value={form.ownerPhone} onChange={form.setOwnerPhone} className="mb-3" />
            ) : (
              <input dir="ltr" value={form.username} onChange={(event) => form.setUsername(event.target.value)} autoComplete="username" className="mb-3 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]" />
            )}
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "password")}</p>
            <input dir="ltr" type="password" value={form.password} onChange={(event) => form.setPassword(event.target.value)} autoComplete="current-password" className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]" />
            <label className="mt-3 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(event) => form.setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-[#C8BCA4] text-[#112A46] accent-[#112A46]"
              />
              <span className="text-taq-meta font-black text-[#716753]">{text(lang, "rememberMe")}</span>
            </label>
            <button type="button" onClick={() => { void form.submitPassword(); }} disabled={form.submitting} className="mt-4 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]">{text(lang, "verifyContinue")}</button>
            {APP_IN_PRODUCTION_MODE && !passwordResetLoading && passwordResetEnabled ? (
              <Link href="/auth/forgot-password" className="mt-3 block text-center text-taq-meta font-black text-[#9A823E]">
                {lang === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}
              </Link>
            ) : null}
          </>
        )}
        {form.error ? <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{form.error}</p> : null}
      </div>
      <button type="button" onClick={onEmployeePortal} className="mt-4 w-full rounded-2xl bg-white py-3.5 text-xs font-black text-[#112A46] ring-1 ring-black/[0.06]">{text(lang, "employeeLogin")}</button>
      {!APP_IN_PRODUCTION_MODE ? <LanHintBanner lang={lang} /> : null}
      {!APP_IN_PRODUCTION_MODE ? (
        <div className="mt-4 rounded-2xl bg-[#FFF4D2] p-4 text-center">
          <p className="text-taq-meta font-black leading-5 text-[#806528]">{text(lang, "prototypeDemoAccess")}</p>
          <p className="mt-1 text-taq-meta font-bold text-[#957D43]">{text(lang, "linkedAccountNote")}</p>
          <p className="mt-2 border-t border-[#E4C66B]/45 pt-2 text-taq-meta font-bold text-[#957D43]">{text(lang, "futureLoginOnLoginScreen")}</p>
        </div>
      ) : null}
      <ReleaseVersionLine
        className="mt-4 text-center text-taq-meta font-bold text-[#827762]"
        lang={lang}
        showBuild
      />
      {!APP_IN_PRODUCTION_MODE ? (
        <p className="mt-2 text-center text-taq-meta font-bold text-[#A99D87]">
          {text(lang, "prototypeBuildLabel")}: <span dir="ltr" className="font-black text-[#112A46]">{PROTOTYPE_BUILD_STAMP}</span>
        </p>
      ) : null}
    </motion.section>
  );
}
