import {
  duplicateSalesGroupKey,
  duplicateSalesSignature,
} from "@/features/operations/operational-entry-mutation-helpers";
import { newestEntries } from "@/features/operations/operational-analytics";

const entryIsActive = (entry) => entry?.status !== "voided";
const entryHasAttachment = (entry) => Boolean(entry?.attachment);

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
 * @param {Array<{ id?: string, status?: string, businessId?: string, attachment?: unknown, reviewed?: boolean }>} [input.operationalEntries]
 * @param {Array<{ id?: string }>} [input.activeBusinesses]
 * @param {(businessId: string) => boolean} [input.attachmentAlertEnabledForBusiness]
 */
export function buildPendingAttachmentReviews({
  operationalEntries = [],
  activeBusinesses = [],
  attachmentAlertEnabledForBusiness = () => false,
}) {
  return newestEntries(
    operationalEntries.filter((entry) => activeBusinesses.some((business) => business.id === entry.businessId)
      && entryIsActive(entry)
      && entryHasAttachment(entry)
      && !entry.reviewed
      && attachmentAlertEnabledForBusiness(entry.businessId)),
  );
}

/**
 * @param {Object} input
 * @param {Array<{ businessId?: string, date?: string, entries?: unknown[] }>} [input.duplicateSalesAlerts]
 * @param {Array<{ id?: string, businessId?: string, date?: string }>} [input.pendingAttachmentReviews]
 * @param {Array<{ id?: string, businessId?: string, seen?: boolean }>} [input.closeoutAlerts]
 * @param {(businessId: string) => boolean} [input.closeoutAlertEnabledForBusiness]
 */
export function buildOwnerNotificationState({
  duplicateSalesAlerts = [],
  pendingAttachmentReviews = [],
  closeoutAlerts = [],
  closeoutAlertEnabledForBusiness = () => false,
}) {
  const unseenCloseoutAlerts = closeoutAlerts.filter(
    (alert) => !alert.seen && closeoutAlertEnabledForBusiness(alert.businessId),
  );
  const ownerHasPendingReview = pendingAttachmentReviews.length > 0;
  const ownerNotificationsVisible = duplicateSalesAlerts.length > 0
    || ownerHasPendingReview
    || unseenCloseoutAlerts.length > 0;
  const ownerNotificationBadge = ownerHasPendingReview
    || duplicateSalesAlerts.length > 0
    || unseenCloseoutAlerts.length > 0;

  return {
    unseenCloseoutAlerts,
    firstPendingAttachmentReview: pendingAttachmentReviews[0] || null,
    ownerHasPendingReview,
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
