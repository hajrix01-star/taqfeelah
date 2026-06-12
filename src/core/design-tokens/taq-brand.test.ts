import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { TAQ_BRAND } from "@/core/design-tokens/taq-brand";
import { ADMIN_CHART_COLORS } from "@/features/saas-admin/components/admin-chart-colors";

function normalizeHex(value: string): string {
  return value.trim().toLowerCase();
}

describe("taq-brand design tokens", () => {
  it("keeps TS palette aligned with taq-brand.css", () => {
    const css = readFileSync(resolve(process.cwd(), "src/core/design-tokens/taq-brand.css"), "utf8");

    for (const [token, hex] of Object.entries(TAQ_BRAND)) {
      const cssVar = `--taq-${token.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;
      expect(css, `missing ${cssVar}`).toContain(`${cssVar}: ${normalizeHex(hex)}`);
    }
  });

  it("derives admin chart colors from brand tokens", () => {
    expect(ADMIN_CHART_COLORS.primary).toBe(TAQ_BRAND.ink);
    expect(ADMIN_CHART_COLORS.secondary).toBe(TAQ_BRAND.gold);
    expect(ADMIN_CHART_COLORS.tertiary).toBe(TAQ_BRAND.muted);
    expect(ADMIN_CHART_COLORS.grid).toBe(TAQ_BRAND.border);
  });
});
