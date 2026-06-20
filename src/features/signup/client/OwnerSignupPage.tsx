"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/prototype-runtime/prototype-runtime-chrome";
import { AppLoginPhoneField } from "@/core/phone/AppLoginPhoneField";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";
import { requestPublicSignupViaApi } from "@/features/signup/client/signup-api-client";
import { usePublicSignupEnabled } from "@/features/signup/client/use-public-signup-enabled";

export default function OwnerSignupPage() {
  const { enabled, loading } = usePublicSignupEnabled();
  const [organizationName, setOrganizationName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const result = await requestPublicSignupViaApi({
        organizationName: organizationName.trim(),
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        email: email.trim(),
      });
      setSuccess(
        typeof result?.message === "string"
          ? result.message
          : "إذا كان التسجيل متاحًا، فسيصلك رابط تأكيد على بريدك الإلكتروني.",
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "تعذر إرسال طلب التسجيل.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir="rtl" className="taq-app-root min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <div className="taq-page-gutter flex min-h-[100dvh] flex-col pb-8 pt-10">
        <div className="mt-10 flex justify-center"><Logo /></div>
        <div className="mt-10 text-center">
          <h1 className="text-2xl font-black">إنشاء حساب تقفيلة</h1>
          <p className="mx-auto mt-3 max-w-[340px] text-sm leading-6 text-[#827762]">
            سجّل منشأتك مجانًا. سنرسل رابط تأكيد إلى بريدك الإلكتروني لإكمال الإعداد.
          </p>
        </div>

        {loading ? (
          <p className="mt-8 text-center text-sm font-bold text-[#827762]">جاري التحقق…</p>
        ) : null}

        {!loading && !enabled ? (
          <div className="mt-8 rounded-[28px] bg-white p-5 text-center shadow-sm ring-1 ring-black/[0.045]">
            <p className="text-sm font-bold text-[#827762]">
              التسجيل الذاتي غير متاح حاليًا. تواصل مع الدعم أو سجّل الدخول إذا كان لديك حساب.
            </p>
            <Link href="/app" className="mt-4 inline-block text-xs font-black text-[#9A823E]">
              الدخول للتطبيق
            </Link>
          </div>
        ) : null}

        {!loading && enabled ? (
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]"
          >
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-[#716753]">اسم المنشأة</span>
              <input
                required
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-[#716753]">اسمك</span>
              <input
                required
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-[#716753]">جوال الدخول</span>
              <AppLoginPhoneField value={ownerPhone} onChange={setOwnerPhone} />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-[#716753]">البريد الإلكتروني</span>
              <input
                dir="ltr"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]"
              />
            </label>
            <p className="text-taq-meta font-bold leading-6 text-[#827762]">
              الباقة: تجريبية مجانية. بعد التأكيد ستختار كلمة مرور للدخول بجوالك.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#112A46] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]"
            >
              إرسال رابط التأكيد
            </button>
            {success ? (
              <p className="rounded-xl bg-[#E6F5E9] p-2.5 text-center text-taq-meta font-bold text-[#257844]">
                {success}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">
                {error}
              </p>
            ) : null}
          </form>
        ) : null}

        <Link href="/app" className="mt-4 text-center text-xs font-black text-[#9A823E]">
          لديك حساب؟ سجّل الدخول
        </Link>
        <ReleaseVersionLine className="mt-4 text-center text-taq-meta font-bold text-[#827762]" lang="ar" showBuild />
      </div>
    </div>
  );
}
