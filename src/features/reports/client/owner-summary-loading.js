/**
 * Owner home/reports: avoid flashing zero totals while API summaries load.
 * Shows a loading state only on the first fetch for a given period/store scope.
 */
export function isOwnerApiSummaryPending({
  apiEnabled = false,
  preferEntrySummaries = false,
  loading = false,
  loaded = false,
  hasData = false,
  loadFailed = false,
}) {
  if (!apiEnabled || preferEntrySummaries || loadFailed) return false;
  return (loading || !loaded) && !hasData;
}
