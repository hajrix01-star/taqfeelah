export const PLAN_MRR_HALALAS: Record<string, number> = {
  starter: 9_900,
  growth: 29_900,
  enterprise: 0,
};

export function resolvePlanMrrHalalas(planCode: string | null | undefined): number {
  if (!planCode) return 0;
  return PLAN_MRR_HALALAS[planCode.toLowerCase()] ?? 0;
}

export function halalasToRiyals(halalas: number): number {
  return Number((halalas / 100).toFixed(2));
}
