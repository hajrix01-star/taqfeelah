/**
 * owner-ledger-filters.js
 *
 * Pure filter logic and helpers for the owner ledger / register view.
 * Extracted from OwnerRegisterScreen.jsx and TaqfeelahPrototypeRuntime.jsx.
 *
 * Designed to support:
 *   - period (day | month | year | custom)
 *   - store (storeId | "all")
 *   - status (active | voided | "all")
 *   - movement type (summary | expense | purchases | withdrawal | "all")
 *   - expense category
 *   - actor (userId | "all")
 *   - sales channel (channelId | "all")
 *   - attachmentOnly (bool)
 *   - pendingReviewOnly (bool)
 *   - viewMode ("operations" | "closeouts") — for future Ledger page
 *
 * None of these functions render UI or own state.
 * Screens import and apply them to local state.
 */

import {
  entryIsActive,
  entryIsVoided,
  entryHasAttachment,
  summarizeEntries,
} from "@/features/operations/operational-analytics";

// ─── Default filter shape ─────────────────────────────────────────

/** The canonical empty filter state for the register log. */
export const DEFAULT_REGISTER_LOG_FILTERS = {
  status: "all",
  type: "all",
  expenseCategory: "all",
  attachmentOnly: false,
  pendingReviewOnly: false,
  actor: "all",
  salesChannel: "all",
};

/** Future-ready filter shape for the full Ledger page (superset of register filters). */
export const DEFAULT_LEDGER_FILTERS = {
  ...DEFAULT_REGISTER_LOG_FILTERS,
  viewMode: "operations", // "operations" | "closeouts"
  storeId: "all",
  period: "month",
  dateFrom: null,
  dateTo: null,
};

// ─── Filter predicates ────────────────────────────────────────────

/** Returns true if `entry` matches the `filters.status` criterion. */
export function matchesStatus(entry, filters) {
  if (filters.status === "all") return true;
  if (filters.status === "active") return entryIsActive(entry);
  if (filters.status === "voided") return entryIsVoided(entry);
  return true;
}

/** Returns true if `entry` matches the `filters.type` + expenseCategory criteria. */
export function matchesType(entry, filters) {
  if (filters.type === "all") return true;
  if (entry.type !== filters.type) return false;
  if (filters.type !== "expense" || filters.expenseCategory === "all") return true;
  return entryCategory(entry) === filters.expenseCategory;
}

/** Returns true if `entry` was created by the actor in `filters.actor`. */
export function matchesActor(entry, filters) {
  return filters.actor === "all" || entry.enteredBy?.userId === filters.actor;
}

/** Returns true if `entry` has a sales channel row matching `filters.salesChannel`. */
export function matchesSalesChannel(entry, filters) {
  if (filters.salesChannel === "all") return true;
  if (entry.type !== "summary") return false;
  return (entry.salesChannels || []).some(
    (row) => row.channelId === filters.salesChannel && Number(row.amount) > 0,
  );
}

/** Returns true if `entry` passes the attachment / pending-review gates. */
export function matchesExtras(entry, filters) {
  if (filters.attachmentOnly && !entryHasAttachment(entry)) return false;
  if (
    filters.pendingReviewOnly
    && !(entryIsActive(entry) && entryHasAttachment(entry) && !entry.reviewed)
  ) return false;
  return true;
}

// ─── Composite filter ─────────────────────────────────────────────

/**
 * Apply all active filters to an entries array.
 * @param {Object[]} entries
 * @param {Object} filters
 * @returns {Object[]}
 */
export function applyLedgerFilters(entries, filters) {
  return entries.filter(
    (entry) =>
      matchesStatus(entry, filters)
      && matchesType(entry, filters)
      && matchesActor(entry, filters)
      && matchesSalesChannel(entry, filters)
      && matchesExtras(entry, filters),
  );
}

// ─── Filter count (badge) ─────────────────────────────────────────

/**
 * Count how many non-default filters are active (used for badge display).
 * @param {Object} filters
 * @returns {number}
 */
export function activeLedgerFilterCount(filters) {
  return (
    Number(filters.status !== "all")
    + Number(filters.type !== "all")
    + Number(filters.expenseCategory !== "all")
    + Number(filters.salesChannel !== "all")
    + Number(Boolean(filters.attachmentOnly))
    + Number(Boolean(filters.pendingReviewOnly))
    + Number(filters.actor !== "all")
  );
}

// ─── Period summary ───────────────────────────────────────────────

/**
 * Compute a period summary for the header of the register/ledger.
 * If a sales-channel filter is active, returns the channel's sales total.
 * Otherwise returns standard summarizeEntries totals.
 *
 * @param {Object[]} entries - already filtered/scoped entries
 * @param {string} salesChannelFilter - "all" or channelId
 * @param {Object[]} channelOptions - for label lookup
 * @param {string} lang
 * @returns {{ mode: "channel" | "totals", amount?: number, sales?: number, expense?: number, net?: number, label?: string }}
 */
export function summarizeLedgerPeriod(entries, salesChannelFilter, channelOptions = [], lang = "ar") {
  const activeEntries = entries.filter(entryIsActive);
  if (salesChannelFilter !== "all") {
    const option = channelOptions.find((item) => item.id === salesChannelFilter);
    let amount = 0;
    activeEntries.forEach((entry) => {
      if (entry.type !== "summary") return;
      (entry.salesChannels || []).forEach((row) => {
        if (row.channelId === salesChannelFilter) amount += Number(row.amount) || 0;
      });
    });
    return {
      mode: "channel",
      label: option?.label || (lang === "ar" ? "قناة" : "Channel"),
      amount,
    };
  }
  const totals = summarizeEntries(entries);
  return { mode: "totals", sales: totals.sales, expense: totals.expense, net: totals.net };
}

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Determine the expense category of an entry.
 * Pure function — no side effects.
 */
export function entryCategory(entry) {
  if (entry.type === "purchases") return "purchases";
  if (entry.type === "withdrawal") return "withdrawal";
  return entry.categoryId || "other";
}

/**
 * Returns the display actor options for the actor filter dropdown,
 * derived from the visible entries (avoids showing actors with no entries).
 *
 * @param {Object[]} entries
 * @param {string} lang
 * @returns {{ id: string, label: string }[]}
 */
export function ledgerActorOptions(entries, lang = "ar") {
  const seen = new Map();
  entries.forEach((entry) => {
    const id = entry.enteredBy?.userId;
    if (!id || seen.has(id)) return;
    const name = lang === "ar"
      ? (entry.enteredBy?.nameAr || entry.enteredBy?.nameEn || id)
      : (entry.enteredBy?.nameEn || entry.enteredBy?.nameAr || id);
    seen.set(id, { id, label: name });
  });
  return [...seen.values()];
}
