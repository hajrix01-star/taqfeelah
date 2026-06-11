"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  SAAS_ADMIN_LOCALE_COOKIE,
  translations,
  type SaasAdminLocale,
  type SaasAdminTranslations,
} from "@/features/saas-admin/i18n/translations";

type SaasAdminLocaleContextValue = {
  locale: SaasAdminLocale;
  dir: "rtl" | "ltr";
  t: SaasAdminTranslations;
  setLocale: (locale: SaasAdminLocale) => void;
};

const SaasAdminLocaleContext = createContext<SaasAdminLocaleContextValue | null>(null);

function persistLocale(locale: SaasAdminLocale) {
  document.cookie = `${SAAS_ADMIN_LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

type SaasAdminLocaleProviderProps = {
  children: ReactNode;
  initialLocale?: SaasAdminLocale;
};

export function SaasAdminLocaleProvider({
  children,
  initialLocale = "ar",
}: SaasAdminLocaleProviderProps) {
  const [locale, setLocaleState] = useState<SaasAdminLocale>(initialLocale);

  const setLocale = useCallback((next: SaasAdminLocale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo<SaasAdminLocaleContextValue>(() => ({
    locale,
    dir: locale === "ar" ? "rtl" : "ltr",
    t: translations[locale],
    setLocale,
  }), [locale, setLocale]);

  return (
    <SaasAdminLocaleContext.Provider value={value}>
      {children}
    </SaasAdminLocaleContext.Provider>
  );
}

export function useSaasAdminLocale() {
  const context = useContext(SaasAdminLocaleContext);
  if (!context) {
    throw new Error("useSaasAdminLocale must be used within SaasAdminLocaleProvider");
  }
  return context;
}
