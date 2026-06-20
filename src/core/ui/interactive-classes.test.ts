import { describe, expect, it } from "vitest";
import { cnInteractive, taqInteractive } from "@/core/ui/interactive-classes";

describe("taqInteractive", () => {
  it("exposes shared row and button class names", () => {
    expect(taqInteractive.row).toContain("taq-interactive-row");
    expect(taqInteractive.primary).toContain("taq-interactive-primary");
  });

  it("merges interactive classes with component classes", () => {
    expect(cnInteractive("px-4 py-2", taqInteractive.surface)).toBe(
      "taq-interactive taq-interactive-surface px-4 py-2",
    );
  });
});
