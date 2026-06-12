"use client";

import type { ElementType, ReactNode } from "react";

export type AdminCardVariant = "default" | "muted" | "dashed" | "inset";
export type AdminCardPadding = "none" | "sm" | "md" | "lg";

type AdminCardProps = {
  as?: ElementType;
  variant?: AdminCardVariant;
  padding?: AdminCardPadding;
  className?: string;
  children: ReactNode;
};

const PADDING_CLASS: Record<AdminCardPadding, string> = {
  none: "",
  sm: "p-3.5 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export function AdminCard({
  as: Component = "div",
  variant = "default",
  padding = "md",
  className = "",
  children,
}: AdminCardProps) {
  const paddingClass = PADDING_CLASS[padding];

  return (
    <Component
      className={`admin-card admin-card--${variant} ${paddingClass} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
