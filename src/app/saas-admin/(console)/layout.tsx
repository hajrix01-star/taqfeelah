import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isPlatformAdminUser } from "@/core/auth/assert-platform-admin-access";
import { resolvePublicRedirectUrl } from "@/core/http/public-redirect";
import { resolveServerAuthSession } from "@/features/auth/server/resolve-server-auth-session";
import { AdminShell } from "@/features/saas-admin/components/AdminShell";
import { SaasAdminUnauthorizedScreen } from "@/features/saas-admin/components/SaasAdminGuardScreens";
import { getSaasAdminLocaleFromCookies } from "@/features/saas-admin/i18n/locale-server";
import { resolveSaasAdminSessionView } from "@/features/saas-admin/server/resolve-saas-admin-session-view";

export default async function SaasAdminConsoleLayout({ children }: { children: ReactNode }) {
  const initialLocale = await getSaasAdminLocaleFromCookies();
  const session = await resolveServerAuthSession();

  if (!session?.userId) {
    redirect(await resolvePublicRedirectUrl(`/saas-admin/login?next=${encodeURIComponent("/saas-admin/overview")}`));
  }

  if (!(await isPlatformAdminUser(session.userId, session.role))) {
    const sessionView = await resolveSaasAdminSessionView(session);
    return (
      <SaasAdminUnauthorizedScreen
        initialLocale={initialLocale}
        session={sessionView}
      />
    );
  }

  const sessionView = await resolveSaasAdminSessionView(session);

  return (
    <AdminShell initialLocale={initialLocale} session={sessionView}>
      {children}
    </AdminShell>
  );
}
