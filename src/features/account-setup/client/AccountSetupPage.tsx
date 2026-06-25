"use client";

import { Logo } from "@/components/taqfeelah-app/taqfeelah-app-chrome";
import { formatLoginPhoneForDisplay } from "@/core/phone/split-login-phone";
import { useAccountSetupForm } from "@/features/account-setup/client/use-account-setup-form";

type AccountSetupPageProps = {
  token: string;
};

export default function AccountSetupPage({ token }: AccountSetupPageProps) {
  const {
    loading,
    preview,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    submitting,
    submit,
    isValid,
  } = useAccountSetupForm(token);

  const title = preview?.purpose === "password_reset"
    ? "كلمة مرور جديدة"
    : "إعداد حسابك في تقفيلة";

  return (
    <div dir="rtl" className="taq-app-root min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <div className="taq-page-gutter flex min-h-[100dvh] flex-col pb-8 pt-10">
        <div className="mt-10 flex justify-center"><Logo /></div>
        <div className="mt-10 text-center">
          <h1 className="text-2xl font-black">{title}</h1>
          {preview ? (
            <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-[#827762]">
              {preview.organizationName} — {preview.ownerName}
            </p>
          ) : null}
        </div>

        {loading ? (
          <p className="mt-8 text-center text-sm font-bold text-[#827762]">جاري التحقق من الرابط…</p>
        ) : null}

        {!loading && !isValid ? (
          <div className="mt-8 rounded-[28px] bg-white p-5 text-center shadow-sm ring-1 ring-black/[0.045]">
            <p className="text-sm font-bold text-[#B44747]">رابط الإعداد غير صالح أو منتهي الصلاحية.</p>
          </div>
        ) : null}

        {!loading && isValid && preview ? (
          <form
            onSubmit={submit}
            className="mt-8 space-y-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]"
          >
            <div className="rounded-2xl bg-[#F7F5EF] p-3 text-center">
              <p className="text-xs font-bold text-[#716753]">جوال الدخول</p>
              <p dir="ltr" className="mt-1 text-sm font-black">
                {formatLoginPhoneForDisplay(preview.phoneNumber) || preview.phoneNumber}
              </p>
            </div>
            {preview.ownerEmail ? (
              <div className="rounded-2xl bg-[#F7F5EF] p-3 text-center">
                <p className="text-xs font-bold text-[#716753]">البريد الإلكتروني</p>
                <p dir="ltr" className="mt-1 text-sm font-black">{preview.ownerEmail}</p>
              </div>
            ) : null}
            <input
              dir="ltr"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="كلمة المرور"
              className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]"
            />
            <input
              dir="ltr"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="تأكيد كلمة المرور"
              className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-sm font-black outline-none ring-1 ring-[#E8E1D4]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#112A46] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]"
            >
              {preview.purpose === "password_reset" ? "حفظ كلمة المرور" : "تفعيل الحساب والدخول"}
            </button>
            {error ? (
              <p className="rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">
                {error}
              </p>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
