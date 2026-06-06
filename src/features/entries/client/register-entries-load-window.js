export const OPERATIONAL_ENTRIES_WORKING_DAYS = 30;
export const OPERATIONAL_ENTRIES_WORKING_LIMIT = 300;
export const OPERATIONAL_ENTRIES_LEGACY_DAYS = 365;
export const OPERATIONAL_ENTRIES_LEGACY_LIMIT = 1000;

export function resolveOperationalEntriesBulkLoadWindow({ paginationEnabled = false } = {}) {
  return {
    lookbackDays: paginationEnabled
      ? OPERATIONAL_ENTRIES_WORKING_DAYS
      : OPERATIONAL_ENTRIES_LEGACY_DAYS,
    limit: paginationEnabled
      ? OPERATIONAL_ENTRIES_WORKING_LIMIT
      : OPERATIONAL_ENTRIES_LEGACY_LIMIT,
  };
}
