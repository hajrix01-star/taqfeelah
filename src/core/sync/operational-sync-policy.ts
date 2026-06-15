/** Owner pages that benefit from background operational sync. */
export const OWNER_OPERATIONAL_SYNC_PAGES = new Set(["home", "register", "closeouts", "notebook"]);

/** Employee pages that benefit from background operational sync. */
export const EMPLOYEE_OPERATIONAL_SYNC_PAGES = new Set(["closeouts"]);

/** Polling interval when tab is visible and sync is active. */
export const OPERATIONAL_SYNC_POLL_INTERVAL_MS = 45_000;

/** SSE heartbeat interval to keep connections alive through proxies. */
export const OPERATIONAL_SYNC_SSE_HEARTBEAT_MS = 25_000;

/** BroadcastChannel name for cross-tab operational sync signals. */
export const OPERATIONAL_SYNC_BROADCAST_CHANNEL = "taqfeelah-operational-sync";

/** Minimum delay between sync refreshes triggered by events (debounce). */
export const OPERATIONAL_SYNC_REFRESH_DEBOUNCE_MS = 750;
