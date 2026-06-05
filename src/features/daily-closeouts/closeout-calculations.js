/**
 * @deprecated
 * This file is kept for backward compatibility only.
 * All calculation functions have been consolidated into:
 *   src/features/operations/operational-analytics.ts
 *
 * TODO: Migrate all importers to operational-analytics.ts and remove this file.
 *
 * Importers to migrate:
 *   - src/features/daily-closeouts/closeout-share-image.js
 *   - src/features/daily-closeouts/closeout-share-operations.js
 *   - src/features/daily-closeouts/daily-closeouts-demo-store.js
 *   - src/features/demo/prototype-month-demo-seed.js
 *   - src/features/employee-closeouts/DailyCloseoutCard.jsx
 *   - src/features/employee-closeouts/DailyCloseoutEntryFlow.jsx
 *   - src/features/owner-closeout-review/OwnerCloseoutReviewPanel.jsx
 */

export { computeCloseoutTotals, salesRecordFromChannels, salesArrayFromRecord } from "@/features/operations/operational-analytics";
