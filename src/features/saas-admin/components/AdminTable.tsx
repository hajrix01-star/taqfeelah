import type { ReactNode } from "react";

type AdminTableProps = {
  columns: string[];
  children: ReactNode;
  empty?: boolean;
  emptyMessage?: string;
};

export function AdminTable({
  columns,
  children,
  empty = false,
  emptyMessage = "لا توجد بيانات",
}: AdminTableProps) {
  if (empty) {
    return (
      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-10 text-center text-sm text-[var(--admin-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="admin-table-scroll overflow-x-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--admin-border)] bg-[#FAFBFC]">
            {columns.map((column) => (
              <th
                key={column}
                className="px-4 py-3 text-right text-xs font-semibold text-[var(--admin-muted)]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--admin-border)]">{children}</tbody>
      </table>
    </div>
  );
}
