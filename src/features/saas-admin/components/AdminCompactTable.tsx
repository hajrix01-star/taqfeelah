"use client";

import { createContext, useContext, type ReactNode } from "react";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";

type AdminCompactTableContextValue = {
  columns: string[];
};

const AdminCompactTableContext = createContext<AdminCompactTableContextValue>({ columns: [] });

type AdminCompactTableProps = {
  columns: string[];
  children: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
};

type AdminCompactTableCellProps = {
  col: number;
  children: ReactNode;
  className?: string;
};

export function AdminCompactTableCell({ col, children, className = "" }: AdminCompactTableCellProps) {
  const { columns } = useContext(AdminCompactTableContext);
  const label = columns[col] ?? "";

  return (
    <td
      data-label={label}
      className={`px-2.5 py-1.5 text-xs ${className}`.trim()}
    >
      {children}
    </td>
  );
}

export function AdminCompactTable({
  columns,
  children,
  empty = false,
  emptyMessage = "لا توجد بيانات",
}: AdminCompactTableProps) {
  if (empty) {
    return (
      <AdminCard variant="inset" padding="sm" className="text-center text-xs text-[var(--admin-muted)]">
        {emptyMessage}
      </AdminCard>
    );
  }

  return (
    <AdminCompactTableContext.Provider value={{ columns }}>
      <div className="overflow-x-auto rounded-lg border border-[var(--admin-border)]">
        <table className="admin-table w-full text-xs">
          <thead className="bg-[var(--admin-surface-muted)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-2.5 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border)] bg-[var(--admin-surface)]">
            {children}
          </tbody>
        </table>
      </div>
    </AdminCompactTableContext.Provider>
  );
}
