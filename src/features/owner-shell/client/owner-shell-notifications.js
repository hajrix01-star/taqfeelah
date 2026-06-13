/**
 * Zero-review policy: duplicate summary owner alerts are removed.
 */
export function buildDuplicateSalesAlerts() {
  return [];
}

/**
 * @param {Object} input
 * @param {Array<{ id?: string, businessId?: string, seen?: boolean }>} [input.closeoutAlerts]
 * @param {(businessId: string) => boolean} [input.closeoutAlertEnabledForBusiness]
 */
export function buildOwnerNotificationState({
  closeoutAlerts = [],
  closeoutAlertEnabledForBusiness = () => false,
}) {
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

/**
 * @param {Object} input
 * @param {Array<{ id?: string }>} [input.activeBusinesses]
 * @param {string} [input.selectedBusiness]
 */
export function resolveActiveViewBusiness({
  activeBusinesses = [],
  selectedBusiness = "all",
}) {
  if (activeBusinesses.length === 1) return activeBusinesses[0].id;
  if (selectedBusiness === "all" || activeBusinesses.some((business) => business.id === selectedBusiness)) {
    return selectedBusiness;
  }
  return "all";
}
