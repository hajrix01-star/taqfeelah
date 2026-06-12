import { TAQ_BRAND } from "@/core/design-tokens/taq-brand";

/** Recharts palette — mirrors --admin-chart-* CSS tokens in admin-theme.css */
export const ADMIN_CHART_COLORS = {
  primary: TAQ_BRAND.ink,
  secondary: TAQ_BRAND.gold,
  tertiary: TAQ_BRAND.muted,
  success: TAQ_BRAND.success,
  grid: TAQ_BRAND.border,
} as const;
