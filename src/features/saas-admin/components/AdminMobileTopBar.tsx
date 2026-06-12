"use client";

import { forwardRef } from "react";
import { Menu, X } from "lucide-react";
import { LanguageToggle } from "@/features/saas-admin/components/LanguageToggle";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type AdminMobileTopBarProps = {
  navOpen: boolean;
  onToggleNav: () => void;
};

export const AdminMobileTopBar = forwardRef<HTMLButtonElement, AdminMobileTopBarProps>(
  function AdminMobileTopBar({ navOpen, onToggleNav }, ref) {
  const { t } = useSaasAdminLocale();

  return (
    <header className="admin-mobile-topbar sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 pb-2.5 sm:gap-3 sm:px-4 lg:hidden">
      <button
        ref={ref}
        type="button"
        data-testid="admin-mobile-menu-btn"
        onClick={onToggleNav}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-primary)]"
        aria-expanded={navOpen}
        aria-controls="saas-admin-sidebar"
        aria-label={navOpen ? t.common.closeMenu : t.common.openMenu}
      >
        {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[var(--admin-muted)]">{t.brand}</p>
        <p className="truncate text-sm font-bold text-[var(--admin-text)]">{t.panelTitle}</p>
      </div>
      <LanguageToggle compact />
    </header>
  );
},
);
