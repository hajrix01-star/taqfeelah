import type { ReactNode } from "react";

type AdminHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminHeader({ title, description, actions }: AdminHeaderProps) {
  return (
    <header className="sticky top-[var(--admin-mobile-topbar-height)] z-10 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/95 backdrop-blur lg:top-0">
      <div className="admin-content-container flex flex-col gap-3 px-4 py-3 sm:px-5 sm:py-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-base font-bold text-[var(--admin-text)] sm:text-lg">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-sm leading-5 text-[var(--admin-muted)]">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
