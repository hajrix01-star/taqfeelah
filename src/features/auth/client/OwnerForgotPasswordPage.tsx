"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/prototype-runtime/prototype-runtime-chrome";
import { requestOwnerPasswordResetViaApi } from "@/features/runtime-settings/client/runtime-session-and-settings-api-client";
import { usePasswordResetEnabled } from "@/features/auth/client/use-password-reset-enabled";

export default function OwnerForgotPasswordPage() {
  const { enabled, loading: statusLoading } = usePasswordResetEnabled();
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
      const result = await requestOwnerPasswordResetViaApi({ email: email.trim() });
      setSuccess(
        typeof result?.message === "string"
          ? result.message
          : "إذا كان هناك حساب بهذا البريد، فسيصلك رابط إعادة التعيين.",
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "تعذر إرسال رابط إعادة التعيين.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <div className="taq-page-gutter flex min-h-[100dvh] flex-col pb-8 pt-10">
        <div className="mt-10 flex justify-center"><Logo /></div>
        <div className="mt-10 text-center">
          <h1 className="text-2xl font-black">استعادة كلمة المرور</h1>
          <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-[#827762]">
            أدخل بريد المالك المسجّل وسنرسل رابطًا لإعادة تعيين كلمة المرور.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
          {statusLoading ? (
            <p className="text-center text-sm font-bold text-[#827762]">جاري التحقق…</p>
          ) : null}
          {!statusLoading && !enabled ? (
            <p className="rounded-xl bg-[#F7F5EF] p-3 text-center text-sm font-bold text-[#827762]">
              استعادة كلمة المرور غير مفعّلة حاليًا. تواصل مع الدعم.
            </p>
          ) : null}
          {!statusLoading && enabled ? (
            <>
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-[#716753]">البريد الإلكتروني</span>
            <input
              dir="ltr"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-2xl bg-[#112A46] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]"
          >
            إرسال رابط إعادة التعيين
          </button>
          {success ? (
            <p className="mt-3 rounded-xl bg-[#E6F5E9] p-2.5 text-center text-taq-meta font-bold text-[#257844]">{success}</p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{error}</p>
          ) : null}
            </>
          ) : null}
        </form>
        <Link href="/app" className="mt-4 text-center text-xs font-black text-[#9A823E]">العودة لتسجيل الدخول</Link>
      </div>
    </div>
  );
}
