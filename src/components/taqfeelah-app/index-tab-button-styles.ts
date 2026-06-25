/**
 * Active index-tab border styles that follow logical top corners (RTL-safe).
 * Replaces ring-inset, which breaks on curved tab-bar edges under overflow-hidden.
 */
import type { IndexTabBorderOptions } from "./taqfeelah-app-types";

export function buildIndexTabBorderClass(
  index: number,
  total: number,
  active: boolean,
  { tier = "main" }: IndexTabBorderOptions = {},
) {
  if (!active) return "";

  const radius = tier === "sub" ? 12 : 14;
  const classes = ["z-10", "border-2", "border-[#112A46]/85", "border-b-0"];

  if (tier === "main") {
    if (index === 0) classes.push(`rounded-ts-[${radius}px]`);
    if (index === total - 1) classes.push(`rounded-te-[${radius}px]`);
  }

  return classes.join(" ");
}
