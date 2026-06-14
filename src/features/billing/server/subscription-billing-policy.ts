export const SUBSCRIPTION_REMINDER_TIERS = [14, 7, 3] as const;

export type SubscriptionReminderTier = (typeof SUBSCRIPTION_REMINDER_TIERS)[number];

export type SubscriptionPeriodPhase = "active" | "grace" | "expired";

const DEFAULT_GRACE_PERIOD_DAYS = 3;

export function resolveSubscriptionGracePeriodDays(
  env?: Record<string, string | undefined>,
): number {
  const raw = (env ?? process.env).SUBSCRIPTION_GRACE_PERIOD_DAYS;
  if (!raw?.trim()) return DEFAULT_GRACE_PERIOD_DAYS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_GRACE_PERIOD_DAYS;
  return parsed;
}

export function resolveDaysUntilPeriodEnd(
  periodEnd: Date | null | undefined,
  now = new Date(),
): number | null {
  if (!periodEnd) return null;
  const diffMs = periodEnd.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function resolveDaysPastPeriodEnd(
  periodEnd: Date | null | undefined,
  now = new Date(),
): number {
  if (!periodEnd) return 0;
  const diffMs = now.getTime() - periodEnd.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function resolveSubscriptionPeriodPhase(input: {
  subscriptionStatus: string | null;
  periodEnd: Date | null;
  isTrialPlan: boolean;
  gracePeriodDays?: number;
  now?: Date;
}): SubscriptionPeriodPhase {
  const now = input.now ?? new Date();
  const periodEnd = input.periodEnd;
  if (!periodEnd || periodEnd.getTime() >= now.getTime()) {
    return "active";
  }

  const status = input.subscriptionStatus?.trim().toLowerCase() ?? "";
  if (status === "trialing" || input.isTrialPlan) {
    return "expired";
  }

  if (status !== "active") {
    return "expired";
  }

  const daysPast = resolveDaysPastPeriodEnd(periodEnd, now);
  const graceDays = input.gracePeriodDays ?? resolveSubscriptionGracePeriodDays();
  return daysPast <= graceDays ? "grace" : "expired";
}

export function resolveSubscriptionBillingAllowed(input: {
  organizationStatus: string;
  subscriptionStatus: string | null;
  periodEnd: Date | null;
  isTrialPlan: boolean;
  gracePeriodDays?: number;
  now?: Date;
}): boolean {
  if (input.organizationStatus === "suspended") return false;
  if (input.organizationStatus === "archived") return false;
  if (input.organizationStatus === "pending_activation") return false;

  const status = input.subscriptionStatus?.trim().toLowerCase() ?? "";
  if (!status) return true;

  if (status === "past_due" || status === "canceled" || status === "inactive") {
    return false;
  }

  const phase = resolveSubscriptionPeriodPhase({
    subscriptionStatus: input.subscriptionStatus,
    periodEnd: input.periodEnd,
    isTrialPlan: input.isTrialPlan,
    gracePeriodDays: input.gracePeriodDays,
    now: input.now,
  });

  if (phase === "active" || phase === "grace") {
    return true;
  }

  return false;
}

export function resolveRenewalReminderTier(
  daysUntilEnd: number | null,
): SubscriptionReminderTier | null {
  if (daysUntilEnd == null || daysUntilEnd < 0) return null;
  for (const tier of SUBSCRIPTION_REMINDER_TIERS) {
    if (daysUntilEnd === tier) return tier;
  }
  return null;
}

export function shouldSendRenewalReminderTier(
  daysUntilEnd: number | null,
  tier: SubscriptionReminderTier,
): boolean {
  return daysUntilEnd != null && daysUntilEnd === tier;
}
