"use client";

/**
 * useOperationalEntriesApi
 *
 * Encapsulates all API orchestration for the operational entries and closeouts:
 *   - loadEntries (fetch + deduplicate + write to state)
 *   - createEntry (post + reload)
 *   - voidEntry / restoreEntry (PATCH + reload)
 *   - syncSubmitCloseout / syncReviewCloseout (closeout lifecycle API + reload)
 *   - loadCloseouts (fetch closeout list)
 *
 * The hook is intentionally NOT a Context provider — it returns plain callbacks
 * that the app shell wires into state setters. This keeps the hook stateless and
 * easy to test in isolation.
 *
 * @param {Object} config
 * @param {string} config.organizationId
 * @param {string} config.ownerUserId
 * @param {string} config.apiActorUserId  — sessionUserId for the current user
 * @param {string} config.apiActorRole    — "owner" | "employee"
 * @param {string} config.apiTargetStoreIdsKey — pipe-separated store UUIDs
 * @param {boolean} config.entriesApiEnabled
 * @param {boolean} config.entriesApiStrictMode
 * @param {boolean} config.closeoutsApiEnabled
 * @param {boolean} config.closeoutsApiStrictMode
 * @param {Function} config.setEntries     — React state setter for operationalEntries
 * @param {Function} config.setEntriesSyncError
 * @param {Function} config.setLastCloseoutDates
 */

import { useCallback } from "react";
import {
  createStoreEntryViaApi,
  fetchStoreEntriesViaApi,
  voidStoreEntryViaApi,
  restoreStoreEntryViaApi,
} from "@/features/entries/client/store-entries-api-client";
import {
  fetchStoreCloseoutsViaApi,
  submitCloseoutViaApi,
  reviewCloseoutViaApi,
  isUuid,
} from "@/features/closeouts/client/closeouts-api-client";
import { todayIsoDate } from "@/utils/display-helpers";
import { entryIsActive } from "@/features/operations/operational-analytics";

/** Compute 365 days ago as YYYY-MM-DD */
function isoDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function useOperationalEntriesApi({
  organizationId,
  ownerUserId,
  apiActorUserId,
  apiActorRole,
  apiTargetStoreIdsKey,
  entriesApiEnabled,
  entriesApiStrictMode,
  closeoutsApiEnabled,
  closeoutsApiStrictMode,
  setEntries,
  setEntriesSyncError,
  setLastCloseoutDates,
}) {
  // ─── Entries ─────────────────────────────────────────────────────

  const loadEntries = useCallback(async () => {
    if (!entriesApiEnabled) {
      if (entriesApiStrictMode) throw new Error("entries API is disabled in production mode.");
      return [];
    }
    if (!isUuid(organizationId)) {
      if (entriesApiStrictMode) throw new Error("organization id is missing/invalid for entries API.");
      return [];
    }
    if (!isUuid(apiActorUserId)) {
      if (entriesApiStrictMode) throw new Error("actor user id is missing/invalid for entries API.");
      return [];
    }

    const targetStoreIds = apiTargetStoreIdsKey
      ? apiTargetStoreIdsKey.split("|").filter(Boolean)
      : [];

    if (!targetStoreIds.length) {
      setEntries([]);
      setEntriesSyncError("");
      return [];
    }

    const dateTo = todayIsoDate();
    const dateFrom = isoDaysAgo(365);

    const fetched = await Promise.all(
      targetStoreIds.map((storeId) =>
        fetchStoreEntriesViaApi({
          organizationId,
          actorUserId: apiActorUserId,
          actorRole: apiActorRole,
          storeId,
          dateFrom,
          dateTo,
          status: "all",
          limit: 1000,
        }),
      ),
    );

    const merged = fetched.flatMap((items) => (Array.isArray(items) ? items : []));
    const seen = new Set();
    const deduped = merged.filter((item) => {
      const id = typeof item?.id === "string" ? item.id : "";
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    setEntries(deduped);
    setEntriesSyncError("");
    return deduped;
  }, [
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
    organizationId,
    entriesApiEnabled,
    entriesApiStrictMode,
    setEntries,
    setEntriesSyncError,
  ]);

  const createEntry = useCallback(
    async ({ payload, actorUserId, actorRole }) => {
      if (!entriesApiEnabled) {
        if (entriesApiStrictMode) throw new Error("entries API is disabled in production mode.");
        return null;
      }
      if (!isUuid(organizationId)) {
        if (entriesApiStrictMode) throw new Error("organization id is missing/invalid for entries API.");
        return null;
      }
      return createStoreEntryViaApi({ organizationId, actorUserId, actorRole, payload });
    },
    [organizationId, entriesApiEnabled, entriesApiStrictMode],
  );

  const voidEntry = useCallback(
    async ({ entry, reason }) => {
      if (!isUuid(organizationId) || !isUuid(ownerUserId)) {
        throw new Error("organization or owner user id is invalid for void.");
      }
      return voidStoreEntryViaApi({
        organizationId,
        actorUserId: ownerUserId,
        actorRole: "owner",
        entry,
        reason: (reason || "").trim(),
      });
    },
    [organizationId, ownerUserId],
  );

  const restoreEntry = useCallback(
    async ({ entry, reason }) => {
      if (!isUuid(organizationId) || !isUuid(ownerUserId)) {
        throw new Error("organization or owner user id is invalid for restore.");
      }
      return restoreStoreEntryViaApi({
        organizationId,
        actorUserId: ownerUserId,
        actorRole: "owner",
        entry,
        reason: (reason || "").trim(),
      });
    },
    [organizationId, ownerUserId],
  );

  // ─── Closeouts ───────────────────────────────────────────────────

  const syncSubmitCloseout = useCallback(
    async ({ action, closeout, employee, reviewWorkflowEnabled }) => {
      if (!closeoutsApiEnabled) {
        if (closeoutsApiStrictMode) throw new Error("closeouts API is disabled in production mode.");
        return null;
      }
      const actorUserId = employee?.apiUserId || employee?.id;
      if (!isUuid(organizationId) || !isUuid(actorUserId) || !isUuid(closeout?.storeId)) {
        if (closeoutsApiStrictMode) throw new Error("closeouts API mapping is invalid for submit.");
        return null;
      }
      const result = await submitCloseoutViaApi({
        organizationId,
        actorUserId,
        actorRole: "employee",
        closeout,
        mode: action === "resubmit" ? "resubmit" : "submit",
        autoReview: !reviewWorkflowEnabled,
      });
      if (entriesApiStrictMode) {
        await loadEntries();
      }
      return result;
    },
    [
      closeoutsApiEnabled,
      closeoutsApiStrictMode,
      organizationId,
      entriesApiStrictMode,
      loadEntries,
    ],
  );

  const syncReviewCloseout = useCallback(
    async ({ action, closeout, reason = "" }) => {
      if (!closeoutsApiEnabled) {
        if (closeoutsApiStrictMode) throw new Error("closeouts API is disabled in production mode.");
        return null;
      }
      if (!isUuid(organizationId) || !isUuid(ownerUserId) || !isUuid(closeout?.storeId)) {
        if (closeoutsApiStrictMode) throw new Error("closeouts API mapping is invalid for review.");
        return null;
      }
      const result = await reviewCloseoutViaApi({
        organizationId,
        actorUserId: ownerUserId,
        actorRole: "owner",
        closeout,
        action,
        reason,
      });
      if (entriesApiStrictMode) {
        await loadEntries();
      }
      return result;
    },
    [
      closeoutsApiEnabled,
      closeoutsApiStrictMode,
      organizationId,
      ownerUserId,
      entriesApiStrictMode,
      loadEntries,
    ],
  );

  const loadCloseouts = useCallback(async () => {
    if (!closeoutsApiEnabled) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API is disabled in production mode.");
      return [];
    }
    if (!isUuid(organizationId) || !isUuid(apiActorUserId)) {
      if (closeoutsApiStrictMode) throw new Error("IDs missing/invalid for closeouts API.");
      return [];
    }

    const targetStoreIds = apiTargetStoreIdsKey
      ? apiTargetStoreIdsKey.split("|").filter(Boolean)
      : [];
    if (!targetStoreIds.length) return [];

    const fetched = await Promise.all(
      targetStoreIds.map((storeId) =>
        fetchStoreCloseoutsViaApi({
          organizationId,
          actorUserId: apiActorUserId,
          actorRole: apiActorRole,
          storeId,
        }),
      ),
    );

    const merged = fetched.flatMap((items) => (Array.isArray(items) ? items : []));
    const seen = new Set();
    return merged.filter((item) => {
      const key = `${typeof item?.id === "string" ? item.id : ""}:${typeof item?.date === "string" ? item.date : ""}`;
      if (!key || key === ":") return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
    closeoutsApiEnabled,
    closeoutsApiStrictMode,
    organizationId,
  ]);

  // ─── Derived helper: reload entries and update lastCloseoutDates ──

  const reloadAndSyncLastCloseout = useCallback(
    async (businessId) => {
      const refreshed = await loadEntries();
      if (businessId && setLastCloseoutDates) {
        const latestActiveDate = refreshed
          .filter(
            (entry) =>
              entry.businessId === businessId
              && entry.type === "summary"
              && entryIsActive(entry),
          )
          .map((entry) => entry.date)
          .sort()
          .pop();
        setLastCloseoutDates((current) => {
          const next = { ...current };
          if (latestActiveDate) next[businessId] = latestActiveDate;
          else delete next[businessId];
          return next;
        });
      }
      return refreshed;
    },
    [loadEntries, setLastCloseoutDates],
  );

  return {
    loadEntries,
    createEntry,
    voidEntry,
    restoreEntry,
    syncSubmitCloseout,
    syncReviewCloseout,
    loadCloseouts,
    reloadAndSyncLastCloseout,
  };
}
