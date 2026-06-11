"use client";

import { Menu, X } from "lucide-react";
import { LanguageToggle } from "@/features/saas-admin/components/LanguageToggle";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type AdminMobileTopBarProps = {
  navOpen: boolean;
  onToggleNav: () => void;
};

export function AdminMobileTopBar({ navOpen, onToggleNav }: AdminMobileTopBarProps) {
  const { t } = useSaasAdminLocale();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 lg:hidden">
      <button
        type="button"
        onClick={onToggleNav}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-white text-[var(--admin-primary)]"
        aria-expanded={navOpen}
        aria-controls="saas-admin-sidebar"
        aria-label={navOpen ? t.common.closeMenu : t.common.openMenu}
      >
        {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[var(--admin-muted)]">{t.brand}</p>
        <p className="truncate text-sm font-bold text-[var(--admin-primary)]">{t.panelTitle}</p>
      </div>
      <LanguageToggle />
    </header>
  );
}
