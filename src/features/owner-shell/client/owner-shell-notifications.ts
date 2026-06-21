import type { CloseoutAlertItem } from "@/features/owner-shell/client/owner-shell-client-types";

/**
 * Zero-review policy: duplicate summary owner alerts are removed.
 */
export function buildDuplicateSalesAlerts(_input?: unknown): unknown[] {
  void _input;
  return [];
}

export type BuildOwnerNotificationStateInput = {
  closeoutAlerts?: CloseoutAlertItem[];
  closeoutAlertEnabledForBusiness?: (businessId: string | undefined) => boolean;
};

export function buildOwnerNotificationState({
  closeoutAlerts = [],
  closeoutAlertEnabledForBusiness = () => false,
}: BuildOwnerNotificationStateInput) {
  const unseenCloseoutAlerts = closeoutAlerts.filter(
    (alert) => !alert.seen && closeoutAlertEnabledForBusiness(alert.businessId),
  );
  const ownerNotificationsVisible = unseenCloseoutAlerts.length > 0;
  const ownerNotificationBadge = unseenCloseoutAlerts.length > 0;

  return {
    unseenCloseoutAlerts,
    ownerNotificationsVisible,
    ownerNotificationBadge,
  };
}

export type ResolveActiveViewBusinessInput = {
  activeBusinesses?: Array<{ id?: string }>;
  selectedBusiness?: string;
};

export function resolveActiveViewBusiness({
  activeBusinesses = [],
  selectedBusiness = "all",
}: ResolveActiveViewBusinessInput): string {
  if (activeBusinesses.length === 1) return activeBusinesses[0].id || "all";
  if (selectedBusiness === "all" || activeBusinesses.some((business) => business.id === selectedBusiness)) {
    return selectedBusiness;
  }
  return "all";
}
