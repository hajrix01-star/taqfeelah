/**
 * owner-ledger-filters.ts
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
  type OperationalEntry,
} from "@/features/operations/operational-analytics";

// ─── Types ────────────────────────────────────────────────────────

export type LedgerFilters = {
  status: "all" | "active" | "voided";
  type: "all" | "summary" | "expense" | "purchases" | "withdrawal";
  expenseCategory: string;
  attachmentOnly: boolean;
  pendingReviewOnly: boolean;
  actor: string;
  salesChannel: string;
  viewMode?: "operations" | "closeouts";
  storeId?: string;
  period?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
};

type ChannelOption = {
  id: string;
  label?: string;
  displayName?: string;
  nameAr?: string;
  nameEn?: string;
  amount?: number;
};

type ActorOption = { id: string; label: string };

// ─── Default filter shapes ────────────────────────────────────────

/** The canonical empty filter state for the register log. */
export const DEFAULT_REGISTER_LOG_FILTERS: LedgerFilters = {
  status: "all",
  type: "all",
  expenseCategory: "all",
  attachmentOnly: false,
  pendingReviewOnly: false,
  actor: "all",
  salesChannel: "all",
};

/** Future-ready filter shape for the full Ledger page (superset of register filters). */
export const DEFAULT_LEDGER_FILTERS: LedgerFilters = {
  ...DEFAULT_REGISTER_LOG_FILTERS,
  viewMode: "operations",
  storeId: "all",
  period: "month",
  dateFrom: null,
  dateTo: null,
};

// ─── Filter predicates ────────────────────────────────────────────

export function matchesStatus(entry: OperationalEntry, filters: LedgerFilters): boolean {
  if (filters.status === "all") return true;
  if (filters.status === "active") return entryIsActive(entry);
  if (filters.status === "voided") return entryIsVoided(entry);
  return true;
}

export function matchesType(entry: OperationalEntry, filters: LedgerFilters): boolean {
  if (filters.type === "all") return true;
  if (entry.type !== filters.type) return false;
  if (filters.type !== "expense" || filters.expenseCategory === "all") return true;
  return entryCategory(entry) === filters.expenseCategory;
}

export function matchesActor(entry: OperationalEntry, filters: LedgerFilters): boolean {
  return (
    filters.actor === "all"
    || (entry as Record<string, unknown> & { enteredBy?: { userId?: string } }).enteredBy?.userId === filters.actor
  );
}

export function matchesSalesChannel(entry: OperationalEntry, filters: LedgerFilters): boolean {
  if (filters.salesChannel === "all") return true;
  if (entry.type !== "summary") return false;
  return ((entry.salesChannels || []) as { channelId: string; amount: number }[]).some(
    (row) => row.channelId === filters.salesChannel && Number(row.amount) > 0,
  );
}

export function matchesExtras(entry: OperationalEntry, filters: LedgerFilters): boolean {
  if (filters.attachmentOnly && !entryHasAttachment(entry)) return false;
  const reviewed = (entry as Record<string, unknown>).reviewed as boolean | undefined;
  if (
    filters.pendingReviewOnly
    && !(entryIsActive(entry) && entryHasAttachment(entry) && !reviewed)
  ) return false;
  return true;
}

// ─── Composite filter ─────────────────────────────────────────────

export function applyLedgerFilters(
  entries: OperationalEntry[],
  filters: LedgerFilters,
): OperationalEntry[] {
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

export function activeLedgerFilterCount(filters: LedgerFilters): number {
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

type PeriodSummary =
  | { mode: "channel"; label: string; amount: number }
  | { mode: "totals"; sales: number; expense: number; net: number };

export function summarizeLedgerPeriod(
  entries: OperationalEntry[],
  salesChannelFilter: string,
  channelOptions: ChannelOption[] = [],
  lang: "ar" | "en" = "ar",
): PeriodSummary {
  const activeEntries = entries.filter(entryIsActive);
  if (salesChannelFilter !== "all") {
    const option = channelOptions.find((item) => item.id === salesChannelFilter);
    let amount = 0;
    activeEntries.forEach((entry) => {
      if (entry.type !== "summary") return;
      ((entry.salesChannels || []) as { channelId: string; amount: number }[]).forEach((row) => {
        if (row.channelId === salesChannelFilter) amount += Number(row.amount) || 0;
      });
    });
    return {
      mode: "channel",
      label: option?.label || option?.displayName || (lang === "ar" ? "قناة" : "Channel"),
      amount,
    };
  }
  const totals = summarizeEntries(entries);
  return { mode: "totals", sales: totals.sales, expense: totals.expense, net: totals.net };
}

// ─── Helpers ──────────────────────────────────────────────────────

export function entryCategory(entry: OperationalEntry): string {
  if (entry.type === "purchases") return "purchases";
  if (entry.type === "withdrawal") return "withdrawal";
  const categoryId = (entry as Record<string, unknown>).categoryId as string | undefined;
  return categoryId || "other";
}

export function ledgerActorOptions(
  entries: OperationalEntry[],
  lang: "ar" | "en" = "ar",
): ActorOption[] {
  const seen = new Map<string, ActorOption>();
  entries.forEach((entry) => {
    const typed = entry as Record<string, unknown> & {
      enteredBy?: { userId?: string; nameAr?: string; nameEn?: string };
    };
    const id = typed.enteredBy?.userId;
    if (!id || seen.has(id)) return;
    const name = lang === "ar"
      ? (typed.enteredBy?.nameAr || typed.enteredBy?.nameEn || id)
      : (typed.enteredBy?.nameEn || typed.enteredBy?.nameAr || id);
    seen.set(id, { id, label: name });
  });
  return [...seen.values()];
}
