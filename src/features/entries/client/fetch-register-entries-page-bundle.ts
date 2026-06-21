import { fetchStoreEntriesPageViaApi } from "./store-entries-api-client";
import { mergeRegisterEntryPages } from "./merge-register-entry-pages";
import type {
  FetchRegisterEntriesPageBundleParams,
  OperationalEntry,
  RegisterEntriesPageState,
} from "./entries-client-types";

export async function fetchRegisterEntriesPageBundle({
  organizationId,
  actorUserId,
  actorRole,
  storeIdList,
  dateFrom,
  dateTo,
  pageSize,
  cursors = new Map<string, string>(),
  replace = false,
  currentEntries = [],
}: FetchRegisterEntriesPageBundleParams): Promise<RegisterEntriesPageState> {
  const responses = await Promise.all(
    storeIdList.map(async (storeId) => {
      const cursor = cursors.get(storeId) || "";
      const page = await fetchStoreEntriesPageViaApi({
        organizationId,
        actorUserId,
        actorRole,
        storeId,
        dateFrom,
        dateTo,
        status: "all",
        limit: pageSize,
        cursor,
      });
      return { storeId, page };
    }),
  );

  const nextCursors = new Map(cursors);
  let nextEntries: OperationalEntry[] = replace ? [] : currentEntries;
  let hasMore = false;

  responses.forEach(({ storeId, page }) => {
    if (!storeId || !page) return;
    nextEntries = mergeRegisterEntryPages(nextEntries, page.items || []);
    if (page.nextCursor) {
      nextCursors.set(storeId, page.nextCursor);
      hasMore = true;
    } else {
      nextCursors.delete(storeId);
    }
  });

  return {
    entries: nextEntries,
    cursors: Object.fromEntries(nextCursors.entries()),
    hasMore,
  };
}

export function cursorsMapFromRecord(record: Record<string, string> = {}): Map<string, string> {
  return new Map(Object.entries(record).filter(([storeId]) => Boolean(storeId)));
}
