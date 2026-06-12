export function halalasToSar(halalas: number): string {
  return (halalas / 100).toFixed(2);
}

export function sarToHalalas(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}
