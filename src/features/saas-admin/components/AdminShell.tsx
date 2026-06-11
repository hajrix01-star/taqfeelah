"use client";

import type { ReactNode } from "react";
import { AppQueryProvider } from "@/core/client/app-query-provider";
import { AdminSidebar } from "@/features/saas-admin/components/AdminSidebar";
import {
  SaasAdminLocaleProvider,
  useSaasAdminLocale,
} from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import type { SaasAdminLocale } from "@/features/saas-admin/i18n/translations";
import type { SaasAdminSessionView } from "@/features/saas-admin/server/resolve-saas-admin-session-view";
import "@/features/saas-admin/components/admin-theme.css";

type AdminShellProps = {
  children: ReactNode;
  initialLocale?: SaasAdminLocale;
  session: SaasAdminSessionView;
};

function AdminShellFrame({
  children,
  session,
}: {
  children: ReactNode;
  session: SaasAdminSessionView;
}) {
  const { dir } = useSaasAdminLocale();

  return (
    <div className="saas-admin-root flex min-h-[100dvh]" dir={dir}>
      <AdminSidebar session={session} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}

export function AdminShell({ children, initialLocale = "ar", session }: AdminShellProps) {
  return (
    <SaasAdminLocaleProvider initialLocale={initialLocale}>
      <AppQueryProvider>
        <AdminShellFrame session={session}>{children}</AdminShellFrame>
      </AppQueryProvider>
    </SaasAdminLocaleProvider>
  );
}
