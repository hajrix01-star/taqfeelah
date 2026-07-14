import type { Metadata } from "next";
import type { ReactNode } from "react";
import { isSaasAdminClientEnabled } from "@/core/config/saas-admin-api-mode";
import { NO_INDEX_ROBOTS } from "@/core/config/seo";
import { SaasAdminDisabledScreen } from "@/features/saas-admin/components/SaasAdminGuardScreens";
import { getSaasAdminLocaleFromCookies } from "@/features/saas-admin/i18n/locale-server";

export const metadata: Metadata = {
  robots: NO_INDEX_ROBOTS,
};

export default async function SaasAdminRootLayout({ children }: { children: ReactNode }) {
  const initialLocale = await getSaasAdminLocaleFromCookies();

  if (!isSaasAdminClientEnabled()) {
    return <SaasAdminDisabledScreen initialLocale={initialLocale} />;
  }

  return children;
}
