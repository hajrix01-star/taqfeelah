"use client";

import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type LanguageToggleProps = {
  compact?: boolean;
};

export function LanguageToggle({ compact = false }: LanguageToggleProps) {
  const { locale, setLocale, t } = useSaasAdminLocale();

  return (
    <div className="flex items-center gap-2">
      {compact ? null : (
        <span className="text-xs font-medium text-[var(--admin-muted)]">{t.language}</span>
      )}
      <div className="flex overflow-hidden rounded-lg border border-[var(--admin-border)]">
        <button
          type="button"
          onClick={() => setLocale("ar")}
          className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            locale === "ar"
              ? "bg-[var(--admin-primary)] text-white"
              : "bg-white text-[var(--admin-text)] hover:bg-[#F3F4F6]"
          }`}
        >
          عربي
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            locale === "en"
              ? "bg-[var(--admin-primary)] text-white"
              : "bg-white text-[var(--admin-text)] hover:bg-[#F3F4F6]"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
