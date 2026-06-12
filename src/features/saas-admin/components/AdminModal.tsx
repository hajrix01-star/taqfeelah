"use client";

import { useEffect, type ReactNode } from "react";

type AdminModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function AdminModal({ open, title, onClose, children }: AdminModalProps) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={title}
        className="absolute inset-0 bg-[var(--admin-text)]/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
        className="relative z-10 flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3">
          <h2 id="admin-modal-title" className="text-sm font-semibold text-[var(--admin-text)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-lg leading-none text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
            aria-label="×"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
