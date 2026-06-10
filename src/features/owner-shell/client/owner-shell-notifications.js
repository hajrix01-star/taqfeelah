import {
  duplicateSalesGroupKey,
  duplicateSalesSignature,
} from "@/features/operations/operational-entry-mutation-helpers";

const entryIsActive = (entry) => entry?.status !== "voided";

/**
 * @param {Object} input
 * @param {Array<{ id?: string, type?: string, status?: string, businessId?: string, date?: string }>} [input.operationalEntries]
 * @param {Array<{ id?: string }>} [input.activeBusinesses]
 * @param {Record<string, string>} [input.acknowledgedDuplicateSales]
 */
export function buildDuplicateSalesAlerts({
  operationalEntries = [],
  activeBusinesses = [],
  acknowledgedDuplicateSales = {},
}) {
  const grouped = new Map();
  operationalEntries
    .filter((entry) => entry.type === "summary"
      && entryIsActive(entry)
      && activeBusinesses.some((business) => business.id === entry.businessId))
    .forEach((entry) => {
      const key = `${entry.businessId}|${entry.date}`;
      if (!grouped.has(key)) {
        grouped.set(key, { businessId: entry.businessId, date: entry.date, entries: [] });
      }
      grouped.get(key).entries.push(entry);
    });

  return [...grouped.values()]
    .filter((group) => group.entries.length > 1
      && acknowledgedDuplicateSales[duplicateSalesGroupKey(group)] !== duplicateSalesSignature(group.entries))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * @param {Object} input
 * @param {Array<{ businessId?: string, date?: string, entries?: unknown[] }>} [input.duplicateSalesAlerts]
 * @param {Array<{ id?: string, businessId?: string, seen?: boolean }>} [input.closeoutAlerts]
 * @param {(businessId: string) => boolean} [input.closeoutAlertEnabledForBusiness]
 */
export function buildOwnerNotificationState({
  duplicateSalesAlerts = [],
  closeoutAlerts = [],
  closeoutAlertEnabledForBusiness = () => false,
}) {
  const unseenCloseoutAlerts = closeoutAlerts.filter(
    (alert) => !alert.seen && closeoutAlertEnabledForBusiness(alert.businessId),
  );
  const ownerNotificationsVisible = duplicateSalesAlerts.length > 0
    || unseenCloseoutAlerts.length > 0;
  const ownerNotificationBadge = duplicateSalesAlerts.length > 0
    || unseenCloseoutAlerts.length > 0;

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
