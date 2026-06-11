"use client";

import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type LanguageToggleProps = {
  compact?: boolean;
  variant?: "default" | "sidebar";
};

export function LanguageToggle({ compact = false, variant = "default" }: LanguageToggleProps) {
  const { locale, setLocale, t } = useSaasAdminLocale();
  const isSidebar = variant === "sidebar";

  return (
    <div className="flex items-center gap-2">
      {compact ? null : (
        <span
          className={`text-xs font-medium ${isSidebar ? "text-[var(--admin-sidebar-muted)]" : "text-[var(--admin-muted)]"}`}
        >
          {t.language}
        </span>
      )}
      <div
        className={`flex overflow-hidden rounded-lg border ${
          isSidebar ? "border-[var(--admin-sidebar-border)]" : "border-[var(--admin-border)]"
        }`}
      >
        <button
          type="button"
          onClick={() => setLocale("ar")}
          className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            locale === "ar"
              ? isSidebar
                ? "bg-[var(--admin-sidebar-active)] text-white"
                : "bg-[var(--admin-primary)] text-white"
              : isSidebar
                ? "bg-transparent text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-hover)]"
                : "bg-white text-[var(--admin-text)] hover:bg-[var(--admin-hover)]"
          }`}
        >
          عربي
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            locale === "en"
              ? isSidebar
                ? "bg-[var(--admin-sidebar-active)] text-white"
                : "bg-[var(--admin-primary)] text-white"
              : isSidebar
                ? "bg-transparent text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-hover)]"
                : "bg-white text-[var(--admin-text)] hover:bg-[var(--admin-hover)]"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
