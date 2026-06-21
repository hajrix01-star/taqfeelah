/**
 * Employee closeouts list: avoid flashing "no closeouts yet" while API data loads.
 * Keeps cached cards visible during pull-to-refresh (stale-while-revalidate).
 */
export function isEmployeeCloseoutsListPending({
  apiEnabled = false,
  loading = false,
  loaded = false,
  hasCachedCloseouts = false,
  loadFailed = false,
}: {
  apiEnabled?: boolean;
  loading?: boolean;
  loaded?: boolean;
  hasCachedCloseouts?: boolean;
  loadFailed?: boolean;
}): boolean {
  if (!apiEnabled || loadFailed) return false;
  return (loading || !loaded) && !hasCachedCloseouts;
}

export function isEmployeeCloseoutsRefreshing({
  apiEnabled = false,
  loading = false,
  hasCachedCloseouts = false,
}: {
  apiEnabled?: boolean;
  loading?: boolean;
  hasCachedCloseouts?: boolean;
}): boolean {
  return Boolean(apiEnabled && loading && hasCachedCloseouts);
}
