import { redirect } from "next/navigation";
import { isPlatformAdminUser } from "@/core/auth/assert-platform-admin-access";
import { resolvePublicRedirectUrl } from "@/core/http/public-redirect";
import { resolveServerAuthSession } from "@/features/auth/server/resolve-server-auth-session";
import { SaasAdminLoginPage } from "@/features/saas-admin/client/SaasAdminLoginPage";
import { getSaasAdminLocaleFromCookies } from "@/features/saas-admin/i18n/locale-server";

type SaasAdminLoginRouteProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SaasAdminLoginRoute({ searchParams }: SaasAdminLoginRouteProps) {
  const initialLocale = await getSaasAdminLocaleFromCookies();
  const params = await searchParams;
  const nextPath = typeof params.next === "string" && params.next.startsWith("/saas-admin")
    ? params.next
    : "/saas-admin/overview";

  const session = await resolveServerAuthSession();
  if (session?.userId && await isPlatformAdminUser(session.userId, session.role)) {
    redirect(await resolvePublicRedirectUrl(nextPath));
  }

  return <SaasAdminLoginPage initialLocale={initialLocale} nextPath={nextPath} />;
}
