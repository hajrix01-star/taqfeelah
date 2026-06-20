import { formatDisplayMoneyFromHalalas } from "@/core/money/format-display-money";

export function halalasToSar(halalas: number): string {
  return formatDisplayMoneyFromHalalas(halalas, "en");
}

export function sarToHalalas(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}
