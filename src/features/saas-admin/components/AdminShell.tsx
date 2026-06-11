"use client";

import type { ReactNode } from "react";
import { AppQueryProvider } from "@/core/client/app-query-provider";
import { AdminSidebar } from "@/features/saas-admin/components/AdminSidebar";
import {
  SaasAdminLocaleProvider,
  useSaasAdminLocale,
} from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import type { SaasAdminLocale } from "@/features/saas-admin/i18n/translations";
import "@/features/saas-admin/components/admin-theme.css";

type AdminShellProps = {
  children: ReactNode;
  initialLocale?: SaasAdminLocale;
};

function AdminShellFrame({ children }: { children: ReactNode }) {
  const { dir } = useSaasAdminLocale();

  return (
    <div className="saas-admin-root flex min-h-[100dvh]" dir={dir}>
      <AdminSidebar />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}

export function AdminShell({ children, initialLocale = "ar" }: AdminShellProps) {
  return (
    <SaasAdminLocaleProvider initialLocale={initialLocale}>
      <AppQueryProvider>
        <AdminShellFrame>{children}</AdminShellFrame>
      </AppQueryProvider>
    </SaasAdminLocaleProvider>
  );
}
