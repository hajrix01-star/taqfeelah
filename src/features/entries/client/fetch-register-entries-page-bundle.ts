import { fetchStoreEntriesPageViaApi } from "./store-entries-api-client";
import { mergeRegisterEntryPages } from "./merge-register-entry-pages";
import type {
  FetchRegisterEntriesPageBundleParams,
  OperationalEntry,
  RegisterEntriesPageState,
} from "./entries-client-types";

export const REGISTER_ENTRIES_EXPORT_MAX_PAGE_REQUESTS = 500;

const emptyRegisterEntriesState: RegisterEntriesPageState = {
  entries: [],
  cursors: {},
  hasMore: false,
};

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

type FetchAllRegisterEntriesPagesParams = Omit<
  FetchRegisterEntriesPageBundleParams,
  "replace" | "currentEntries" | "cursors"
> & {
  initialState?: RegisterEntriesPageState;
  maxPageRequests?: number;
  fetchPageBundle?: typeof fetchRegisterEntriesPageBundle;
};

export async function fetchAllRegisterEntriesPages({
  organizationId,
  actorUserId,
  actorRole,
  storeIdList,
  dateFrom,
  dateTo,
  pageSize,
  initialState = emptyRegisterEntriesState,
  maxPageRequests = REGISTER_ENTRIES_EXPORT_MAX_PAGE_REQUESTS,
  fetchPageBundle = fetchRegisterEntriesPageBundle,
}: FetchAllRegisterEntriesPagesParams): Promise<RegisterEntriesPageState> {
  let current = initialState;
  let requestCount = 0;

  const fetchFirstPage = async () => fetchPageBundle({
    organizationId,
    actorUserId,
    actorRole,
    storeIdList,
    dateFrom,
    dateTo,
    pageSize,
    replace: true,
    currentEntries: [],
  });

  const fetchNextPage = async (state: RegisterEntriesPageState) => fetchPageBundle({
    organizationId,
    actorUserId,
    actorRole,
    storeIdList: storeIdList.filter((storeId) => Boolean(state.cursors?.[storeId])),
    dateFrom,
    dateTo,
    pageSize,
    cursors: cursorsMapFromRecord(state.cursors),
    replace: false,
    currentEntries: state.entries,
  });

  try {
    if (!current.entries.length && !Object.keys(current.cursors || {}).length) {
      requestCount += 1;
      current = await fetchFirstPage();
    }

    while (current.hasMore) {
      if (requestCount >= maxPageRequests) {
        throw new Error("register entries pagination exceeded safety limit.");
      }
      requestCount += 1;
      current = await fetchNextPage(current);
    }

    return current;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`register entries export load failed: ${message}`);
  }
}
