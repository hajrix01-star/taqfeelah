"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppQueryProvider } from "@/core/client/app-query-provider";
import { AdminMobileTopBar } from "@/features/saas-admin/components/AdminMobileTopBar";
import { AdminSidebar } from "@/features/saas-admin/components/AdminSidebar";
import { useAdminMobileNav } from "@/features/saas-admin/hooks/use-admin-mobile-nav";
import {
  SaasAdminLocaleProvider,
  useSaasAdminLocale,
} from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import type { SaasAdminLocale } from "@/features/saas-admin/i18n/translations";
import type { SaasAdminSessionView } from "@/features/saas-admin/server/resolve-saas-admin-session-view";
import "@/features/saas-admin/components/admin-theme.css";

type AdminShellProps = {
  children: ReactNode;
  initialLocale?: SaasAdminLocale;
  session: SaasAdminSessionView;
};

function AdminShellFrame({
  children,
  session,
}: {
  children: ReactNode;
  session: SaasAdminSessionView;
}) {
  const { dir, t } = useSaasAdminLocale();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const closeNav = useCallback(() => {
    setNavOpen(false);
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [navOpen]);

  useAdminMobileNav({
    navOpen,
    onClose: closeNav,
    menuButtonRef,
    sidebarRef,
  });

  return (
    <div className="saas-admin-root flex min-h-[100dvh]" dir={dir}>
      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[var(--taq-ink)]/45 lg:hidden"
          aria-label={t.common.closeMenu}
          onClick={closeNav}
        />
      ) : null}
      <AdminSidebar
        ref={sidebarRef}
        id="saas-admin-sidebar"
        session={session}
        mobileOpen={navOpen}
        onNavigate={closeNav}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileTopBar
          ref={menuButtonRef}
          navOpen={navOpen}
          onToggleNav={() => setNavOpen((open) => !open)}
        />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminShell({ children, initialLocale = "ar", session }: AdminShellProps) {
  return (
    <SaasAdminLocaleProvider initialLocale={initialLocale}>
      <AppQueryProvider>
        <AdminShellFrame session={session}>{children}</AdminShellFrame>
      </AppQueryProvider>
    </SaasAdminLocaleProvider>
  );
}
