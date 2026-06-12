export const CORE_USAGE_EVENT_NAMES = ["closeout_submitted", "entry_created"] as const;

export type EngagementSegment =
  | "power"
  | "regular"
  | "intermittent"
  | "dormant"
  | "churned";

export type SubscriberBillingType = "trial" | "paid" | "free" | "churned";

export const ENGAGEMENT_SEGMENT_THRESHOLDS = {
  powerMinDays: 15,
  regularMinDays: 8,
  intermittentMinDays: 1,
} as const;

export function resolveEngagementSegment(input: {
  activeDaysL30: number;
  organizationStatus: string;
  subscriptionStatus: string | null;
  daysSinceLastCoreActivity: number | null;
}): EngagementSegment {
  const subscriptionStatus = input.subscriptionStatus?.toLowerCase() || null;
  const organizationStatus = input.organizationStatus.toLowerCase();

  if (
    organizationStatus === "archived"
    || organizationStatus === "suspended"
    || subscriptionStatus === "canceled"
    || subscriptionStatus === "cancelled"
    || (input.daysSinceLastCoreActivity !== null && input.daysSinceLastCoreActivity >= 60
      && subscriptionStatus !== "active"
      && subscriptionStatus !== "trialing"
      && subscriptionStatus !== "past_due")
  ) {
    return "churned";
  }

  if (input.activeDaysL30 >= ENGAGEMENT_SEGMENT_THRESHOLDS.powerMinDays) return "power";
  if (input.activeDaysL30 >= ENGAGEMENT_SEGMENT_THRESHOLDS.regularMinDays) return "regular";
  if (input.activeDaysL30 >= ENGAGEMENT_SEGMENT_THRESHOLDS.intermittentMinDays) return "intermittent";
  return "dormant";
}

export function resolveSubscriberBillingType(subscriptionStatus: string | null): SubscriberBillingType {
  const status = subscriptionStatus?.toLowerCase() || null;
  if (!status) return "free";
  if (status === "trialing") return "trial";
  if (status === "active" || status === "past_due") return "paid";
  if (status === "canceled" || status === "cancelled") return "churned";
  return "free";
}

export function isPayingSubscriberBillingType(billingType: SubscriberBillingType): boolean {
  return billingType === "trial" || billingType === "paid";
}

export function percentOfTotal(count: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((count / total) * 100).toFixed(1));
}

export function diffDaysUtc(fromIsoDate: string, toIsoDate: string): number {
  const from = Date.parse(`${fromIsoDate}T00:00:00.000Z`);
  const to = Date.parse(`${toIsoDate}T00:00:00.000Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

export function subtractDaysUtc(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
