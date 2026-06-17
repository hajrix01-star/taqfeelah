"use client";

import { activateWaitingServiceWorker } from "@/features/pwa/pwa-service-worker";

type AppRuntimeLoadErrorScreenProps = {
  onSoftRetry: () => void;
};

export function AppRuntimeLoadErrorScreen({ onSoftRetry }: AppRuntimeLoadErrorScreenProps) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#F8F6F0] px-6 text-center"
      dir="rtl"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <p className="text-sm font-black text-[#B44747]">تعذّر تحميل التطبيق</p>
      <p className="text-xs font-bold leading-6 text-[#827762]">
        تحقق من الاتصال ثم أعد المحاولة. إن استمر الخطأ، حدّث التطبيق أو امسح بيانات الموقع.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          className="rounded-2xl border border-[#112A46]/20 bg-white px-5 py-3 text-xs font-black text-[#112A46]"
          onClick={onSoftRetry}
        >
          إعادة المحاولة
        </button>
        <button
          type="button"
          className="rounded-2xl bg-[#112A46] px-5 py-3 text-xs font-black text-white"
          onClick={async () => {
            await activateWaitingServiceWorker();
            window.location.reload();
          }}
        >
          تحديث التطبيق
        </button>
      </div>
    </div>
  );
}
