"use client";

import type { ReactNode } from "react";
import { AdminSidebar } from "@/features/saas-admin/components/AdminSidebar";
import "@/features/saas-admin/components/admin-theme.css";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="saas-admin-root flex min-h-[100dvh]" dir="rtl">
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      <AdminSidebar />
    </div>
  );
}
