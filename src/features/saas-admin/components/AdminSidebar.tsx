"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  LayoutDashboard,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AdminSessionFooter } from "@/features/saas-admin/components/AdminSessionFooter";
import { LanguageToggle } from "@/features/saas-admin/components/LanguageToggle";
import { useMaxLg } from "@/features/saas-admin/hooks/use-max-lg";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import type { SaasAdminSessionView } from "@/features/saas-admin/server/resolve-saas-admin-session-view";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";

const NAV_PATHS: Array<{
  href: string;
  key: "overview" | "accounts" | "usage" | "investorMetrics" | "systemHealth";
  icon: LucideIcon;
}> = [
  { href: "/saas-admin/overview", key: "overview", icon: LayoutDashboard },
  { href: "/saas-admin/accounts", key: "accounts", icon: Users },
  { href: "/saas-admin/usage", key: "usage", icon: BarChart3 },
  { href: "/saas-admin/investor-metrics", key: "investorMetrics", icon: TrendingUp },
  { href: "/saas-admin/system-health", key: "systemHealth", icon: Activity },
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
  const { locale, t } = useSaasAdminLocale();
  const isMobileLayout = useMaxLg();

  return (
    <aside
      ref={ref}
      id={id}
      data-testid="admin-sidebar"
      aria-hidden={isMobileLayout && !mobileOpen ? true : undefined}
      className={`admin-sidebar flex w-[min(85vw,18rem)] shrink-0 flex-col border-inline-start lg:w-64 ${
        mobileOpen
          ? "max-lg:translate-x-0"
          : "max-lg:pointer-events-none max-lg:-translate-x-full rtl:max-lg:translate-x-full"
      }`}
    >
      <div className="hidden border-b border-[var(--admin-sidebar-border)] px-4 py-4 lg:block">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-sidebar-muted)]">
          {t.brand}
        </p>
        <h1 className="mt-1 text-base font-bold text-[var(--admin-sidebar-text)]">{t.panelTitle}</h1>
        <ReleaseVersionLine
          className="mt-1.5 text-[11px] font-semibold text-[var(--admin-sidebar-muted)]"
          lang={locale}
          showBuild
        />
        <div className="mt-3">
          <LanguageToggle variant="sidebar" />
        </div>
      </div>
      <div className="border-b border-[var(--admin-sidebar-border)] px-4 py-3 lg:hidden">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-sidebar-muted)]">
          {t.brand}
        </p>
        <h2 className="mt-0.5 text-sm font-bold text-[var(--admin-sidebar-text)]">{t.panelTitle}</h2>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2" aria-label={t.panelTitle}>
        {NAV_PATHS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--admin-sidebar-active)] text-white"
                  : "text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-hover)]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span>{t.nav[item.key]}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--admin-sidebar-border)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <AdminSessionFooter session={session} variant="sidebar" />
      </div>
    </aside>
  );
});
