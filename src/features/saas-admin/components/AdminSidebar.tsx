"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageToggle } from "@/features/saas-admin/components/LanguageToggle";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

const NAV_PATHS = [
  { href: "/saas-admin/overview", key: "overview" as const },
  { href: "/saas-admin/accounts", key: "accounts" as const },
  { href: "/saas-admin/usage", key: "usage" as const },
  { href: "/saas-admin/investor-metrics", key: "investorMetrics" as const },
  { href: "/saas-admin/system-health", key: "systemHealth" as const },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useSaasAdminLocale();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-inline-start border-[var(--admin-border)] bg-[var(--admin-surface)]">
      <div className="border-b border-[var(--admin-border)] px-5 py-6">
        <p className="text-xs font-semibold tracking-wide text-[var(--admin-muted)]">{t.brand}</p>
        <h1 className="mt-1 text-lg font-bold text-[var(--admin-primary)]">{t.panelTitle}</h1>
        <div className="mt-4">
          <LanguageToggle />
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_PATHS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
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
      <div className="border-t border-[var(--admin-border)] px-5 py-4 text-xs text-[var(--admin-muted)]">
        {t.readOnlyFooter}
      </div>
    </aside>
  );
}
