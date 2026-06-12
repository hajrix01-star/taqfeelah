"use client";

import { createContext, useContext, type ReactNode } from "react";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";

type AdminTableContextValue = {
  columns: string[];
};

const AdminTableContext = createContext<AdminTableContextValue>({ columns: [] });

type AdminTableProps = {
  columns: string[];
  children: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
};

type AdminTableCellProps = {
  col: number;
  children: ReactNode;
  className?: string;
};

export function AdminTableCell({ col, children, className = "" }: AdminTableCellProps) {
  const { columns } = useContext(AdminTableContext);
  const label = columns[col] ?? "";

  return (
    <td
      data-label={label}
      className={`admin-table-cell px-3.5 py-2.5 ${className}`.trim()}
    >
      {children}
    </td>
  );
}

export function AdminTable({
  columns,
  children,
  empty = false,
  emptyMessage = "لا توجد بيانات",
}: AdminTableProps) {
  if (empty) {
    return (
      <AdminCard padding="md" className="px-4 py-8 text-center text-sm text-[var(--admin-muted)] sm:px-5">
        {emptyMessage}
      </AdminCard>
    );
  }

  return (
    <AdminTableContext.Provider value={{ columns }}>
      <div className="admin-table-scroll overflow-x-auto">
        <AdminCard padding="none" className="overflow-hidden">
          <table className="admin-table w-full text-sm">
            <thead className="admin-table-head">
              <tr className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-3.5 py-2.5 text-right text-xs font-semibold text-[var(--admin-muted)]"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="admin-table-body divide-y divide-[var(--admin-border)]">
              {children}
            </tbody>
          </table>
        </AdminCard>
      </div>
    </AdminTableContext.Provider>
  );
}
