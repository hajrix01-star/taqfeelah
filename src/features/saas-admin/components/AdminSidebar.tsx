"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSessionFooter } from "@/features/saas-admin/components/AdminSessionFooter";
import { LanguageToggle } from "@/features/saas-admin/components/LanguageToggle";
import { useMaxLg } from "@/features/saas-admin/hooks/use-max-lg";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import type { SaasAdminSessionView } from "@/features/saas-admin/server/resolve-saas-admin-session-view";

const NAV_PATHS = [
  { href: "/saas-admin/overview", key: "overview" as const },
  { href: "/saas-admin/accounts", key: "accounts" as const },
  { href: "/saas-admin/usage", key: "usage" as const },
  { href: "/saas-admin/investor-metrics", key: "investorMetrics" as const },
  { href: "/saas-admin/system-health", key: "systemHealth" as const },
];

type AdminSidebarProps = {
  id?: string;
  session: SaasAdminSessionView;
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export const AdminSidebar = forwardRef<HTMLElement, AdminSidebarProps>(function AdminSidebar(
  {
    id = "saas-admin-sidebar",
    session,
    mobileOpen = false,
    onNavigate,
  },
  ref,
) {
  const pathname = usePathname();
  const { t } = useSaasAdminLocale();
  const isMobileLayout = useMaxLg();

  return (
    <aside
      ref={ref}
      id={id}
      data-testid="admin-sidebar"
      aria-hidden={isMobileLayout && !mobileOpen ? true : undefined}
      className={`admin-sidebar flex w-[min(85vw,18rem)] shrink-0 flex-col border-inline-start border-[var(--admin-border)] bg-[var(--admin-surface)] lg:w-64 ${
        mobileOpen
          ? "max-lg:translate-x-0"
          : "max-lg:pointer-events-none max-lg:-translate-x-full rtl:max-lg:translate-x-full"
      }`}
    >
      <div className="hidden border-b border-[var(--admin-border)] px-5 py-6 lg:block">
        <p className="text-xs font-semibold tracking-wide text-[var(--admin-muted)]">{t.brand}</p>
        <h1 className="mt-1 text-lg font-bold text-[var(--admin-primary)]">{t.panelTitle}</h1>
        <div className="mt-4">
          <LanguageToggle />
        </div>
      </div>
      <div className="border-b border-[var(--admin-border)] px-5 py-4 lg:hidden">
        <p className="text-xs font-semibold tracking-wide text-[var(--admin-muted)]">{t.brand}</p>
        <h2 className="mt-1 text-base font-bold text-[var(--admin-primary)]">{t.panelTitle}</h2>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label={t.panelTitle}>
        {NAV_PATHS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
                active
                  ? "bg-[var(--admin-primary)] text-white"
                  : "text-[var(--admin-text)] hover:bg-[#F3F4F6]"
              }`}
            >
              {t.nav[item.key]}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--admin-border)] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <AdminSessionFooter session={session} />
      </div>
    </aside>
  );
});
