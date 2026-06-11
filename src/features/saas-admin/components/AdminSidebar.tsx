"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/saas-admin/overview", label: "نظرة عامة" },
  { href: "/saas-admin/accounts", label: "الحسابات" },
  { href: "/saas-admin/usage", label: "تقارير الاستخدام" },
  { href: "/saas-admin/investor-metrics", label: "مؤشرات المستثمر" },
  { href: "/saas-admin/system-health", label: "صحة النظام" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-[var(--admin-border)] bg-[var(--admin-surface)]">
      <div className="border-b border-[var(--admin-border)] px-5 py-6">
        <p className="text-xs font-semibold tracking-wide text-[var(--admin-muted)]">تقفيلة</p>
        <h1 className="mt-1 text-lg font-bold text-[var(--admin-primary)]">لوحة SaaS Admin</h1>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
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
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--admin-border)] px-5 py-4 text-xs text-[var(--admin-muted)]">
        قراءة فقط — إدارة المنصة
      </div>
    </aside>
  );
}
