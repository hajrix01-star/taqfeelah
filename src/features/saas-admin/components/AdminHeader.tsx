import type { ReactNode } from "react";

type AdminHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminHeader({ title, description, actions }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/95 px-6 py-5 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--admin-primary)]">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-[var(--admin-muted)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}
