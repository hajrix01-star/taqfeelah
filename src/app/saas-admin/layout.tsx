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

export default async function SaasAdminLayout({ children }: { children: ReactNode }) {
  if (!isSaasAdminClientEnabled()) {
    return <SaasAdminDisabledScreen />;
  }

  const session = await resolveServerAuthSession();
  if (!session?.userId) {
    return <SaasAdminUnauthenticatedScreen />;
  }

  if (!isPlatformAdminUser(session.userId)) {
    return <SaasAdminUnauthorizedScreen />;
  }

  return <AdminShell>{children}</AdminShell>;
}
