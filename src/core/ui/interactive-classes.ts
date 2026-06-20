/**
 * Single source for interactive CSS class names (hover / active / cursor).
 * Pair with `src/core/ui/interactive.css` and tokens in `taq-brand.css`.
 */
export const taqInteractive = {
  base: "taq-interactive",
  none: "taq-interactive-none",
  row: "taq-interactive taq-interactive-row",
  rowDanger: "taq-interactive taq-interactive-row taq-interactive-row-danger",
  surface: "taq-interactive taq-interactive-surface",
  icon: "taq-interactive taq-interactive-icon",
  primary: "taq-interactive taq-interactive-primary",
  success: "taq-interactive taq-interactive-success",
  chip: "taq-interactive taq-interactive-chip",
  nav: "taq-interactive taq-interactive-nav",
  link: "taq-interactive taq-interactive-link",
} as const;

export type TaqInteractiveClass = typeof taqInteractive[keyof typeof taqInteractive];

/** Merge interactive classes with existing className strings. */
export function cnInteractive(base: string, interactive: TaqInteractiveClass): string {
  return `${interactive} ${base}`.trim();
}
