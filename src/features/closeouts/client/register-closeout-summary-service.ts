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
 * Resolve a full closeout record for owner edit — cache → reload → targeted API fetch.
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

  const fromCache = resolveCloseoutForOperationalEntry(
    { closeoutId: summary.closeoutId },
    cachedCloseouts,
  );
  if (fromCache) return fromCache;

  if (typeof reloadCloseouts === "function") {
    try {
      const reloaded = await reloadCloseouts();
      const match = resolveCloseoutForOperationalEntry(
        { closeoutId: summary.closeoutId },
        reloaded,
      );
      if (match) return match;
    } catch {
      // fall through to date-scoped fetch
    }
  }

  const storeId = String(summary.businessId || "");
  const date = String(summary.date || "");
  if (storeId && date && typeof fetchStoreCloseouts === "function") {
    try {
      const rows = await fetchStoreCloseouts(storeId, date);
      return resolveCloseoutForOperationalEntry({ closeoutId: summary.closeoutId }, rows) || null;
    } catch {
      return null;
    }
  }

  return null;
}
