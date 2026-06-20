"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/prototype-runtime/prototype-runtime-chrome";
import { ownerPasswordInputProps } from "@/features/auth/client/auth-gate/owner-password-input-props";
import {
  confirmOwnerPasswordResetViaApi,
  validateOwnerPasswordResetTokenViaApi,
} from "@/features/runtime-settings/client/runtime-session-and-settings-api-client";

type OwnerResetPasswordPageProps = {
  token: string;
};

export default function OwnerResetPasswordPage({ token }: OwnerResetPasswordPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    validateOwnerPasswordResetTokenViaApi(token)
      .then((result) => {
        if (cancelled) return;
        setValid(result?.valid === true);
      })
      .catch(() => {
        if (!cancelled) setValid(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await confirmOwnerPasswordResetViaApi({
        token,
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });
      router.replace("/app");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "تعذر إعادة تعيين كلمة المرور.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir="rtl" className="taq-app-root min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <div className="taq-page-gutter flex min-h-[100dvh] flex-col pb-8 pt-10">
        <div className="mt-10 flex justify-center"><Logo /></div>
        <div className="mt-10 text-center">
          <h1 className="text-2xl font-black">كلمة مرور جديدة</h1>
        </div>
        {loading ? (
          <p className="mt-8 text-center text-sm font-bold text-[#827762]">جاري التحقق من الرابط…</p>
        ) : null}
        {!loading && !valid ? (
          <div className="mt-8 rounded-[28px] bg-white p-5 text-center shadow-sm ring-1 ring-black/[0.045]">
            <p className="text-sm font-bold text-[#B44747]">رابط إعادة التعيين غير صالح أو منتهي الصلاحية.</p>
            <Link href="/auth/forgot-password" className="mt-4 inline-block text-xs font-black text-[#9A823E]">طلب رابط جديد</Link>
          </div>
        ) : null}
        {!loading && valid ? (
          <form onSubmit={handleSubmit} className="mt-8 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
            <input
              dir="ltr"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="كلمة المرور الجديدة"
              {...ownerPasswordInputProps}
              className="mb-3 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]"
            />
            <input
              dir="ltr"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="تأكيد كلمة المرور"
              {...ownerPasswordInputProps}
              className="mb-3 w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#112A46] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]"
            >
              حفظ كلمة المرور
            </button>
            {error ? (
              <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{error}</p>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
