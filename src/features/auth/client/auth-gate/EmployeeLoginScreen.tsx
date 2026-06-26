"use client";

import { motion } from "framer-motion";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";
import { useEmployeeLoginForm } from "@/features/auth/client/auth-gate/use-employee-login-form";
import { text } from "@/components/taqfeelah-app/taqfeelah-app-catalog-data";
import { APP_IN_PRODUCTION_MODE } from "@/components/taqfeelah-app/taqfeelah-app-boot";
import { LanguageSwitch, Logo } from "@/components/taqfeelah-app/taqfeelah-app-chrome";
import { AppLoginPhoneField } from "@/core/phone/AppLoginPhoneField";
import type {
  AuthLangProps,
  AuthStaffMember,
  EmployeeLoginCallback,
} from "@/features/auth/client/auth-client-types";

type EmployeeLoginScreenProps = AuthLangProps & {
  staff?: AuthStaffMember[];
  onBack: () => void;
  onLogin: EmployeeLoginCallback;
};

export function EmployeeLoginScreen({
  lang,
  setLang,
  staff = [],
  onBack,
  onLogin,
}: EmployeeLoginScreenProps) {
  const form = useEmployeeLoginForm({ lang, staff, onLogin });

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter flex min-h-[800px] flex-col pb-8 pt-10">
      <div className="flex justify-end"><LanguageSwitch lang={lang} setLang={setLang} /></div>
      <div className="mt-16 flex justify-center"><Logo /></div>
      <div className="mt-10 text-center">
        <h1 className="text-2xl font-black text-[#112A46]">{text(lang, "employeeLogin")}</h1>
        <p className="mx-auto mt-3 max-w-[280px] text-sm leading-6 text-[#827762]">{text(lang, "employeeLoginSubtitle")}</p>
      </div>
      <div className="mt-8 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
        {APP_IN_PRODUCTION_MODE ? (
          <>
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "mobileNumber")}</p>
            <AppLoginPhoneField value={form.employeePhone} onChange={form.setEmployeePhone} className="mb-4" />
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "employeePin")}</p>
            <input dir="ltr" inputMode="numeric" value={form.pin} onChange={(event) => form.setPin(event.target.value)} placeholder="• • • •" className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-4 text-center text-xl font-black tracking-[0.45em] outline-none ring-1 ring-[#E8E1D4]" />
            <label className="mt-3 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={form.trustDevice}
                onChange={(event) => form.setTrustDevice(event.target.checked)}
                className="h-4 w-4 rounded border-[#C8BCA4] text-[#112A46] accent-[#112A46]"
              />
              <span className="text-taq-meta font-black text-[#716753]">
                {lang === "ar" ? "حفظ هذا الجهاز" : "Trust this device"}
              </span>
            </label>
          </>
        ) : (
          <>
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "employee")}</p>
            {form.activeStaff.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {form.activeStaff.map((person) => (
                  <button key={person.id || person.apiUserId || person.legacyId} type="button" onClick={() => form.setSelectedId(person.id || "")} className={`rounded-full px-3 py-2 text-taq-meta font-black ${form.selectedId === person.id ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]"}`}>
                    {lang === "ar" ? person.nameAr : person.nameEn}
                  </button>
                ))}
              </div>
            ) : form.rosterLoading ? (
              <p className="mb-4 rounded-2xl bg-[#F7F5EF] px-4 py-3 text-center text-taq-meta font-bold text-[#827762]">
                {lang === "ar" ? "جاري تحميل قائمة الموظفين..." : "Loading employee list..."}
              </p>
            ) : (
              <input
                dir="ltr"
                value={form.manualEmployeeId}
                onChange={(event) => form.setManualEmployeeId(event.target.value)}
                placeholder={lang === "ar" ? "Employee ID" : "Employee ID"}
                className="mb-4 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]"
              />
            )}
          </>
        )}
        {!APP_IN_PRODUCTION_MODE ? (
          <>
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "employeePin")}</p>
            <input dir="ltr" inputMode="numeric" value={form.pin} onChange={(event) => form.setPin(event.target.value)} placeholder="• • • •" className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-4 text-center text-xl font-black tracking-[0.45em] outline-none ring-1 ring-[#E8E1D4]" />
          </>
        ) : null}
        <button type="button" onClick={() => { void form.submit(); }} disabled={form.submitting} className="mt-4 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]">{text(lang, "verifyContinue")}</button>
        {form.error ? <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{form.error}</p> : null}
      </div>
      <button type="button" onClick={onBack} className="mt-4 w-full text-xs font-black text-[#9A823E]">{text(lang, "backToLoginGateway")}</button>
      <ReleaseVersionLine
        className="mt-4 text-center text-taq-meta font-bold text-[#A99D87]"
        lang={lang}
        showBuild
      />
    </motion.section>
  );
}
