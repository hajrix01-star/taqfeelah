"use client";

import { motion } from "framer-motion";
import { useOwnerPasswordChangeForm } from "@/features/auth/client/auth-gate/use-owner-password-change-form";
import { ownerPasswordInputProps } from "@/features/auth/client/auth-gate/owner-password-input-props";
import { LanguageSwitch, Logo } from "@/components/prototype-runtime/prototype-runtime-chrome";

export function OwnerPasswordChangeScreen({ lang, setLang, onComplete, onLogout }) {
  const form = useOwnerPasswordChangeForm({ lang, onComplete });

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-page-gutter flex min-h-[800px] flex-col pb-8 pt-10">
      <div className="flex justify-end"><LanguageSwitch lang={lang} setLang={setLang} /></div>
      <div className="mt-16 flex justify-center"><Logo lang={lang} /></div>
      <div className="mt-10 text-center">
        <h1 className="text-2xl font-black text-[#112A46]">{lang === "ar" ? "تغيير كلمة المرور" : "Change password"}</h1>
        <p className="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-[#827762]">
          {lang === "ar" ? "يجب تغيير كلمة المرور المؤقتة قبل استخدام النظام." : "You must change your temporary password before using the app."}
        </p>
      </div>
      <div className="mt-8 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
        <input dir="ltr" type="password" value={form.currentPassword} onChange={(event) => form.setCurrentPassword(event.target.value)} placeholder={lang === "ar" ? "كلمة المرور المؤقتة" : "Temporary password"} {...ownerPasswordInputProps} className="mb-3 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]" />
        <input dir="ltr" type="password" value={form.newPassword} onChange={(event) => form.setNewPassword(event.target.value)} placeholder={lang === "ar" ? "كلمة المرور الجديدة" : "New password"} {...ownerPasswordInputProps} className="mb-3 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]" />
        <input dir="ltr" type="password" value={form.confirmPassword} onChange={(event) => form.setConfirmPassword(event.target.value)} placeholder={lang === "ar" ? "تأكيد كلمة المرور" : "Confirm password"} {...ownerPasswordInputProps} className="mb-3 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]" />
        <button type="button" onClick={() => { void form.submit(); }} disabled={form.submitting} className="w-full rounded-2xl bg-[#112A46] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]">{lang === "ar" ? "حفظ كلمة المرور" : "Save password"}</button>
        {form.error ? <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{form.error}</p> : null}
        <button type="button" onClick={onLogout} className="mt-4 w-full text-xs font-black text-[#9A823E]">{lang === "ar" ? "تسجيل الخروج" : "Log out"}</button>
      </div>
    </motion.section>
  );
}
