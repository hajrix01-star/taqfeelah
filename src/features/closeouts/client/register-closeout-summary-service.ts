import { resolveCloseoutForOperationalEntry } from "@/features/operations/client/register-operations-selection";
import type { CloseoutRecord } from "@/features/operations/client/operations-client-types";

export type RegisterCloseoutSummaryRef = {
  closeoutId?: string | null;
  businessId?: string;
  date?: string;
};

export type RegisterCloseoutDeleteRequest = {
  closeoutId: string;
  storeId: string;
  date?: string;
};

export function buildRegisterCloseoutDeleteRequest(
  summary: RegisterCloseoutSummaryRef | null | undefined,
): RegisterCloseoutDeleteRequest | null {
  const closeoutId = typeof summary?.closeoutId === "string" ? summary.closeoutId.trim() : "";
  const storeId = typeof summary?.businessId === "string" ? summary.businessId.trim() : "";
  if (!closeoutId || !storeId) return null;
  return {
    closeoutId,
    storeId,
    date: typeof summary?.date === "string" ? summary.date : undefined,
  };
}

export function closeoutDeleteRequestToRecord(
  request: RegisterCloseoutDeleteRequest,
): CloseoutRecord {
  return {
    id: request.closeoutId,
    storeId: request.storeId,
    date: request.date,
  };
}

export type ResolveRegisterCloseoutOptions = {
  cachedCloseouts?: CloseoutRecord[];
  reloadCloseouts?: () => Promise<CloseoutRecord[]>;
  fetchStoreCloseouts?: (storeId: string, date: string) => Promise<CloseoutRecord[]>;
};

/**
 * Resolve a full closeout record for owner edit.
 * Uses the unified closeouts React Query cache (via DailyCloseoutsProvider) first,
 * then reloadCloseouts, then optional date-scoped fetch fallback.
 */
export async function resolveCloseoutRecordForRegisterSummary(
  summary: RegisterCloseoutSummaryRef,
  {
    cachedCloseouts = [],
    reloadCloseouts,
    fetchStoreCloseouts,
  }: ResolveRegisterCloseoutOptions = {},
): Promise<CloseoutRecord | null> {
  if (!summary?.closeoutId) return null;

  const ref = { closeoutId: summary.closeoutId };

  const fromCache = resolveCloseoutForOperationalEntry(ref, cachedCloseouts);
  if (fromCache) return fromCache;

  const storeId = String(summary.businessId || "");
  const date = String(summary.date || "");
  if (storeId && date && typeof fetchStoreCloseouts === "function") {
    try {
      const rows = await fetchStoreCloseouts(storeId, date);
      const match = resolveCloseoutForOperationalEntry(ref, rows);
      if (match) return match;
    } catch (error) {
      console.warn("register closeout date-scoped fetch failed", error);
    }
  }

  if (typeof reloadCloseouts === "function") {
    try {
      const reloaded = await reloadCloseouts();
      return resolveCloseoutForOperationalEntry(ref, reloaded) || null;
    } catch (error) {
      console.warn("register closeout reload failed", error);
    }
  }

  return null;
}
