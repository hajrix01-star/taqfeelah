"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  activateMemberInvitationViaApi,
  fetchPublicInvitationViaApi,
} from "@/features/member-invitations/client/member-invitations-api-client";
import { Logo } from "@/components/prototype-runtime/prototype-runtime-chrome";

type InviteActivationPageProps = {
  token: string;
};

type InvitationPreview = {
  displayName: string;
  organizationName: string;
  storeName: string;
  roleLabel: string;
  status: string;
  expiresAt: string;
  canActivate: boolean;
};

export default function InviteActivationPage({ token }: InviteActivationPageProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loadError, setLoadError] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [trustDevice, setTrustDevice] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPublicInvitationViaApi(token)
      .then((data) => {
        if (cancelled) return;
        setPreview(data as InvitationPreview);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "تعذر تحميل الدعوة.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview?.canActivate || submitting) return;
    setSubmitError("");
    setSubmitting(true);
    try {
      await activateMemberInvitationViaApi({
        token,
        phone: phone.trim(),
        pin: pin.trim(),
        trustDevice,
      });
      router.replace("/app");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "تعذر تفعيل الدعوة.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <div className="taq-page-gutter flex min-h-[100dvh] flex-col pb-8 pt-10">
        <div className="mt-10 flex justify-center"><Logo /></div>
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-black">تمت دعوتك لاستخدام تقفيلة</h1>
        </div>

        {loadError ? (
          <div className="mt-8 rounded-[28px] bg-white p-5 text-center shadow-sm ring-1 ring-black/[0.045]">
            <p className="text-sm font-bold text-[#B44747]">{loadError}</p>
          </div>
        ) : null}

        {preview && !loadError ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
              <p className="text-xs font-bold text-[#716753]">اسم النشاط</p>
              <p className="mt-1 text-sm font-black">{preview.organizationName}</p>
              <p className="mt-4 text-xs font-bold text-[#716753]">اسم المحل</p>
              <p className="mt-1 text-sm font-black">{preview.storeName}</p>
              <p className="mt-4 text-xs font-bold text-[#716753]">اسم الموظف</p>
              <p className="mt-1 text-sm font-black">{preview.displayName}</p>
              <p className="mt-4 text-xs font-bold text-[#716753]">الدور</p>
              <p className="mt-1 text-sm font-black">{preview.roleLabel}</p>
              {!preview.canActivate ? (
                <p className="mt-4 rounded-2xl bg-[#FFF1EE] p-3 text-center text-taq-meta font-bold text-[#B44747]">
                  {preview.status === "expired" && "انتهت صلاحية هذه الدعوة."}
                  {preview.status === "revoked" && "تم إلغاء هذه الدعوة."}
                  {preview.status === "used" && "تم استخدام هذه الدعوة مسبقًا."}
                  {preview.status === "locked" && "تم قفل هذه الدعوة بعد محاولات خاطئة."}
                  {preview.status === "pending" && "لا يمكن تفعيل هذه الدعوة حاليًا."}
                </p>
              ) : null}
            </div>

            {preview.canActivate ? (
              <form onSubmit={handleSubmit} className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
                <label className="mb-4 block">
                  <span className="mb-2 block text-xs font-bold text-[#716753]">جوالك</span>
                  <input
                    dir="ltr"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-center text-sm font-black outline-none ring-1 ring-[#E8E1D4]"
                    required
                  />
                </label>
                <label className="mb-4 block">
                  <span className="mb-2 block text-xs font-bold text-[#716753]">رمز PIN من المالك</span>
                  <input
                    dir="ltr"
                    inputMode="numeric"
                    value={pin}
                    onChange={(event) => setPin(event.target.value)}
                    className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-center text-xl font-black tracking-[0.45em] outline-none ring-1 ring-[#E8E1D4]"
                    required
                    minLength={4}
                    maxLength={12}
                  />
                </label>
                <label className="mb-4 flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(event) => setTrustDevice(event.target.checked)}
                    className="h-4 w-4 rounded border-[#C8BCA4] text-[#112A46] accent-[#112A46]"
                  />
                  <span className="text-taq-meta font-black text-[#716753]">حفظ هذا الجهاز — الدخول بالجوال فقط لاحقًا</span>
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]"
                >
                  تفعيل الدخول
                </button>
                {submitError ? (
                  <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">
                    {submitError}
                  </p>
                ) : null}
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
