import { SaasAdminResetPasswordPage } from "@/features/saas-admin/client/SaasAdminResetPasswordPage";
import { getSaasAdminLocaleFromCookies } from "@/features/saas-admin/i18n/locale-server";

type SaasAdminResetPasswordRouteProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function SaasAdminResetPasswordRoute({ searchParams }: SaasAdminResetPasswordRouteProps) {
  const initialLocale = await getSaasAdminLocaleFromCookies();
  const params = await searchParams;
  return (
    <SaasAdminResetPasswordPage
      initialLocale={initialLocale}
      token={typeof params.token === "string" ? params.token : ""}
    />
  );
}
