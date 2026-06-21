import { fetchStoreCloseoutsViaApi } from "@/features/closeouts/client/closeouts-api-client";
import type { CloseoutRecord } from "@/features/operations/client/operations-client-types";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import {
  resolveCloseoutRecordForRegisterSummary,
  type ResolveRegisterCloseoutOptions,
} from "./register-closeout-summary-service";

export type RegisterCloseoutApiFetchContext = {
  enabled?: boolean;
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
};

export function createFetchStoreCloseoutsForRegister(
  context: RegisterCloseoutApiFetchContext,
): (storeId: string, date: string) => Promise<CloseoutRecord[]> {
  if (!context.enabled) {
    return async () => [];
  }
  const organizationId = typeof context.organizationId === "string" ? context.organizationId.trim() : "";
  const actorUserId = typeof context.actorUserId === "string" ? context.actorUserId.trim() : "";
  if (!organizationId || !actorUserId) {
    return async () => [];
  }

  return async (storeId, date) => {
    const rows = await fetchStoreCloseoutsViaApi({
      organizationId,
      actorUserId,
      actorRole: context.actorRole,
      storeId,
      dateFrom: date,
      dateTo: date,
    });
    return rows as CloseoutRecord[];
  };
}

export function buildRegisterCloseoutResolveOptions({
  cachedCloseouts = [],
  reloadCloseouts,
  apiContext,
}: {
  cachedCloseouts?: CloseoutRecord[];
  reloadCloseouts?: () => Promise<CloseoutRecord[]>;
  apiContext?: RegisterCloseoutApiFetchContext;
}): ResolveRegisterCloseoutOptions {
  const fetchStoreCloseouts = createFetchStoreCloseoutsForRegister(apiContext || {});
  return {
    cachedCloseouts,
    reloadCloseouts,
    fetchStoreCloseouts,
  };
}

export async function resolveRegisterCloseoutFromEntry(
  entry: Pick<OperationalEntry, "closeoutId" | "businessId" | "date"> | null | undefined,
  options: ResolveRegisterCloseoutOptions,
): Promise<CloseoutRecord | null> {
  if (!entry?.closeoutId) return null;
  return resolveCloseoutRecordForRegisterSummary(
    {
      closeoutId: entry.closeoutId,
      businessId: entry.businessId,
      date: entry.date,
    },
    options,
  );
}
