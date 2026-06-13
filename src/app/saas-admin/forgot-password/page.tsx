import { SaasAdminForgotPasswordPage } from "@/features/saas-admin/client/SaasAdminForgotPasswordPage";
import { getSaasAdminLocaleFromCookies } from "@/features/saas-admin/i18n/locale-server";

export default async function SaasAdminForgotPasswordRoute() {
  const initialLocale = await getSaasAdminLocaleFromCookies();
  return <SaasAdminForgotPasswordPage initialLocale={initialLocale} />;
}
