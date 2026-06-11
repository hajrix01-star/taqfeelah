import type { ReactNode } from "react";
import { isSaasAdminClientEnabled } from "@/core/config/saas-admin-api-mode";
import { SaasAdminDisabledScreen } from "@/features/saas-admin/components/SaasAdminGuardScreens";
import { getSaasAdminLocaleFromCookies } from "@/features/saas-admin/i18n/locale-server";

export default async function SaasAdminRootLayout({ children }: { children: ReactNode }) {
  const initialLocale = await getSaasAdminLocaleFromCookies();

  if (!isSaasAdminClientEnabled()) {
    return <SaasAdminDisabledScreen initialLocale={initialLocale} />;
  }

  return children;
}
