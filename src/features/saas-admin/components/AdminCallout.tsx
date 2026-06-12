import type { ReactNode } from "react";

type AdminCalloutTone = "warning" | "info" | "danger";

type AdminCalloutProps = {
  children: ReactNode;
  tone?: AdminCalloutTone;
  className?: string;
};

export function AdminCallout({ children, tone = "warning", className = "" }: AdminCalloutProps) {
  return (
    <div className={`admin-callout admin-callout--${tone} ${className}`.trim()}>
      {children}
    </div>
  );
}
