import { cookies } from "next/headers";
import {
  SAAS_ADMIN_LOCALE_COOKIE,
  type SaasAdminLocale,
} from "@/features/saas-admin/i18n/translations";

export async function getSaasAdminLocaleFromCookies(): Promise<SaasAdminLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SAAS_ADMIN_LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "ar";
}
