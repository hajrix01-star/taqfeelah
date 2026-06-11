import type { ReactNode } from "react";

type AdminHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function AdminHeader({ title, description, actions }: AdminHeaderProps) {
  return (
    <header className="sticky top-[var(--admin-mobile-topbar-height)] z-10 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/95 px-4 py-4 backdrop-blur sm:px-6 sm:py-5 lg:top-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-[var(--admin-primary)] sm:text-xl">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-[var(--admin-muted)]">{description}</p>
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
