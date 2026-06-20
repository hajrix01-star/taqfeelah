"use client";

import { Logo } from "@/components/prototype-runtime/prototype-runtime-chrome";
import { StandardLoginPhoneField } from "@/core/phone/StandardLoginPhoneField";
import { useInviteActivationForm } from "@/features/member-invitations/client/use-invite-activation-form";

type InviteActivationPageProps = {
  token: string;
};

export default function InviteActivationPage({ token }: InviteActivationPageProps) {
  const form = useInviteActivationForm(token);

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <div className="taq-page-gutter flex min-h-[100dvh] flex-col pb-8 pt-10">
        <div className="mt-10 flex justify-center"><Logo /></div>
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-black">تمت دعوتك لاستخدام تقفيلة</h1>
        </div>

        {form.loadError ? (
          <div className="mt-8 rounded-[28px] bg-white p-5 text-center shadow-sm ring-1 ring-black/[0.045]">
            <p className="text-sm font-bold text-[#B44747]">{form.loadError}</p>
          </div>
        ) : null}

        {form.preview && !form.loadError ? (
          <div className="mt-8 space-y-4">
            <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
              <p className="text-xs font-bold text-[#716753]">اسم النشاط</p>
              <p className="mt-1 text-sm font-black">{form.preview.organizationName}</p>
              <p className="mt-4 text-xs font-bold text-[#716753]">اسم المحل</p>
              <p className="mt-1 text-sm font-black">{form.preview.storeName}</p>
              <p className="mt-4 text-xs font-bold text-[#716753]">اسم الموظف</p>
              <p className="mt-1 text-sm font-black">{form.preview.displayName}</p>
              <p className="mt-4 text-xs font-bold text-[#716753]">الدور</p>
              <p className="mt-1 text-sm font-black">{form.preview.roleLabel}</p>
              {!form.preview.canActivate ? (
                <p className="mt-4 rounded-2xl bg-[#FFF1EE] p-3 text-center text-taq-meta font-bold text-[#B44747]">
                  {form.preview.status === "expired" && "انتهت صلاحية هذه الدعوة."}
                  {form.preview.status === "revoked" && "تم إلغاء هذه الدعوة."}
                  {form.preview.status === "used" && "تم استخدام هذه الدعوة مسبقًا."}
                  {form.preview.status === "locked" && "تم قفل هذه الدعوة بعد محاولات خاطئة."}
                  {form.preview.status === "pending" && "لا يمكن تفعيل هذه الدعوة حاليًا."}
                </p>
              ) : null}
            </div>

            {form.preview.canActivate ? (
              <form onSubmit={form.submit} className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/[0.045]">
                <label className="mb-4 block">
                  <span className="mb-2 block text-xs font-bold text-[#716753]">جوالك</span>
                  <StandardLoginPhoneField
                    surface="activation"
                    value={form.phone}
                    onChange={form.setPhone}
                  />
                </label>
                <label className="mb-4 block">
                  <span className="mb-2 block text-xs font-bold text-[#716753]">رمز PIN من المالك</span>
                  <input
                    dir="ltr"
                    inputMode="numeric"
                    value={form.pin}
                    onChange={(event) => form.setPin(event.target.value)}
                    className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3.5 text-center text-xl font-black tracking-[0.45em] outline-none ring-1 ring-[#E8E1D4]"
                    required
                    minLength={4}
                    maxLength={12}
                  />
                </label>
                <label className="mb-4 flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={form.trustDevice}
                    onChange={(event) => form.setTrustDevice(event.target.checked)}
                    className="h-4 w-4 rounded border-[#C8BCA4] text-[#112A46] accent-[#112A46]"
                  />
                  <span className="text-taq-meta font-black text-[#716753]">حفظ هذا الجهاز — الدخول بالجوال فقط لاحقًا</span>
                </label>
                <button
                  type="submit"
                  disabled={form.submitting}
                  className="w-full rounded-2xl bg-[#39A160] py-4 text-sm font-black text-white disabled:bg-[#B8C0B7]"
                >
                  تفعيل الدخول
                </button>
                {form.submitError ? (
                  <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">
                    {form.submitError}
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
