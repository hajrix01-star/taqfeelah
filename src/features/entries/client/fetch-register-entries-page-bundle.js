import { fetchStoreEntriesPageViaApi } from "./store-entries-api-client";
import { mergeRegisterEntryPages } from "./merge-register-entry-pages";

/**
 * @param {object} input
 * @param {string[]} input.storeIdList
 * @param {Map<string, string>} [input.cursors]
 * @param {boolean} [input.replace=false]
 * @param {Array<object>} [input.currentEntries=[]]
 */
export async function fetchRegisterEntriesPageBundle({
  organizationId,
  actorUserId,
  actorRole,
  storeIdList,
  dateFrom,
  dateTo,
  pageSize,
  cursors = new Map(),
  replace = false,
  currentEntries = [],
}) {
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
  let nextEntries = replace ? [] : currentEntries;
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

export function cursorsMapFromRecord(record = {}) {
  return new Map(Object.entries(record).filter(([storeId]) => Boolean(storeId)));
}
