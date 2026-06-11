"use client";

import { isSaasAdminClientEnabled } from "@/core/config/saas-admin-api-mode";
import SaasAdminDashboard from "@/features/saas-admin/client/SaasAdminDashboard";

export default function SaasAdminPage() {
  if (!isSaasAdminClientEnabled()) {
    return (
      <main
        dir="rtl"
        className="flex min-h-[100dvh] items-center justify-center bg-[#F8F6F0] px-6 font-sans text-[#112A46]"
      >
        <section className="max-w-xl rounded-[28px] bg-white p-8 text-center ring-1 ring-black/[0.045]">
          <h1 className="text-lg font-black">لوحة SaaS غير مفعّلة</h1>
          <p className="mt-3 text-sm font-bold leading-7 text-[#716753]">
            فعّل
            {" "}
            <code className="rounded bg-[#F0ECE2] px-2 py-1">NEXT_PUBLIC_SAAS_ADMIN_ENABLED=true</code>
            {" "}
            و
            {" "}
            <code className="rounded bg-[#F0ECE2] px-2 py-1">SAAS_ADMIN_API_ENABLED=true</code>
            {" "}
            ثم عيّن
            {" "}
            <code className="rounded bg-[#F0ECE2] px-2 py-1">SAAS_PLATFORM_ADMIN_USER_IDS</code>
            .
          </p>
        </section>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-[100dvh] bg-[#F8F6F0] px-4 py-8 font-sans text-[#112A46] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SaasAdminDashboard />
      </div>
    </main>
  );
}
