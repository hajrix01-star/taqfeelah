export const PLAN_CODES = ["trial", "starter", "growth", "enterprise"] as const;

export type PlanCode = (typeof PLAN_CODES)[number];

export const PAID_PLAN_CODES = ["starter", "growth", "enterprise"] as const;

export type PaidPlanCode = (typeof PAID_PLAN_CODES)[number];

export const DEFAULT_PLAN_CODE: PlanCode = "trial";

export function isTrialPlanCode(planCode: string | null | undefined): boolean {
  return planCode === "trial";
}

export function isPaidPlanCode(planCode: string | null | undefined): planCode is PaidPlanCode {
  return planCode === "starter" || planCode === "growth" || planCode === "enterprise";
}

export function parsePlanCode(value: unknown): PlanCode | null {
  if (typeof value !== "string") return null;
  return PLAN_CODES.includes(value as PlanCode) ? value as PlanCode : null;
}
