import type { ReactNode } from "react";
import { isPlatformAdminUser } from "@/core/auth/assert-platform-admin-access";
import { isSaasAdminClientEnabled } from "@/core/config/saas-admin-api-mode";
import { resolveServerAuthSession } from "@/features/auth/server/resolve-server-auth-session";
import { AdminShell } from "@/features/saas-admin/components/AdminShell";
import {
  SaasAdminDisabledScreen,
  SaasAdminUnauthorizedScreen,
  SaasAdminUnauthenticatedScreen,
} from "@/features/saas-admin/components/SaasAdminGuardScreens";
import { getSaasAdminLocaleFromCookies } from "@/features/saas-admin/i18n/locale-server";

export default async function SaasAdminLayout({ children }: { children: ReactNode }) {
  const initialLocale = await getSaasAdminLocaleFromCookies();

  if (!isSaasAdminClientEnabled()) {
    return <SaasAdminDisabledScreen initialLocale={initialLocale} />;
  }

  const session = await resolveServerAuthSession();
  if (!session?.userId) {
    return <SaasAdminUnauthenticatedScreen initialLocale={initialLocale} />;
  }

  if (!isPlatformAdminUser(session.userId)) {
    return <SaasAdminUnauthorizedScreen initialLocale={initialLocale} />;
  }

  return <AdminShell initialLocale={initialLocale}>{children}</AdminShell>;
}
