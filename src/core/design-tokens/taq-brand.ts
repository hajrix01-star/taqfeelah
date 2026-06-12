/**
 * Taqfeelah brand primitives — single source for product shell, marketing, and admin.
 * CSS mirror: src/core/design-tokens/taq-brand.css
 */
export const TAQ_BRAND = {
  cream: "#F8F6F0",
  creamSoft: "#F7F5EF",
  creamPaper: "#FFFDF8",
  ink: "#112A46",
  inkSoft: "#1A3A5C",
  inkDeep: "#0D2138",
  muted: "#827762",
  soft: "#716753",
  gold: "#D4A843",
  goldSoft: "#E8C56A",
  border: "#ECE6DA",
  borderSoft: "#F0ECE2",
  danger: "#B44747",
  dangerBg: "#FFF1EE",
  warningBg: "#FFF4D2",
  warningText: "#806528",
  warningBorder: "#F0D9A2",
  success: "#2D6A4F",
  successBg: "#E8F5EE",
} as const;

export type TaqBrandToken = keyof typeof TAQ_BRAND;
