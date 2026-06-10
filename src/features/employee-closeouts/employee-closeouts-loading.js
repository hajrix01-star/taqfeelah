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
}) {
  if (!apiEnabled || loadFailed) return false;
  return (loading || !loaded) && !hasCachedCloseouts;
}

export function isEmployeeCloseoutsRefreshing({
  apiEnabled = false,
  loading = false,
  hasCachedCloseouts = false,
}) {
  return Boolean(apiEnabled && loading && hasCachedCloseouts);
}
