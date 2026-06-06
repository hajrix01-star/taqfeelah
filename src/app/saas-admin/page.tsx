"use client";

import { isSaasAdminClientEnabled } from "@/core/config/saas-admin-api-mode";

export default function SaasAdminPage() {
  if (!isSaasAdminClientEnabled()) {
    return (
      <main
        dir="rtl"
        className="flex min-h-[100dvh] items-center justify-center bg-[#F8F6F0] px-6 font-sans text-[#112A46]"
      >
        <section className="max-w-xl rounded-3xl bg-white p-8 text-center ring-1 ring-black/[0.05]">
          <h1 className="text-lg font-black">لوحة SaaS غير مفعّلة</h1>
          <p className="mt-3 text-sm font-bold leading-7 text-[#716753]">
            تم تجهيز الأساس فقط. فعّل العلم
            {" "}
            <code className="rounded bg-[#F0ECE2] px-2 py-1">NEXT_PUBLIC_SAAS_ADMIN_ENABLED=true</code>
            {" "}
            قبل الإطلاق.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-[100dvh] bg-[#F8F6F0] px-6 py-10 font-sans text-[#112A46]"
    >
      <section className="mx-auto max-w-6xl rounded-3xl bg-white p-8 ring-1 ring-black/[0.05]">
        <h1 className="text-2xl font-black">إدارة المنصة (SaaS Admin)</h1>
        <p className="mt-3 text-sm font-bold leading-7 text-[#716753]">
          الهيكل جاهز. اربط KPIs والاشتراكات عبر
          {" "}
          <code className="rounded bg-[#F0ECE2] px-2 py-1">/api/v1/saas-admin/*</code>
          {" "}
          بعد تفعيل
          {" "}
          <code className="rounded bg-[#F0ECE2] px-2 py-1">SAAS_ADMIN_API_ENABLED=true</code>
          .
        </p>
      </section>
    </main>
  );
}
