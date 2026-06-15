"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildOperationalEntriesFromCloseout } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import {
  makeAttachment,
  storeAttachmentPayload,
  stripEmbeddedAttachmentImages,
} from "@/features/attachments/client/prototype-attachment-storage";
import { hasCloseoutApiActorMapping, isUuid } from "@/features/closeouts/client/closeouts-api-client";
import {
  createStoreEntryViaApi,
  fetchStoreEntriesViaApi,
} from "@/features/entries/client/store-entries-api-client";
import { resolveOperationalEntriesBulkLoadWindow } from "@/features/entries/client/register-entries-load-window";
import {
  filterOwnerDuplicateWatchEntries,
  resolveOwnerDuplicateWatchWindow,
} from "@/features/operations/client/owner-duplicate-watch";
import { mergeLastCloseoutDateForStore } from "@/features/operations/operational-entry-save-helpers";
import { resolvePayloadAttachmentForPhase9Api } from "@/features/phase9/client/inline-attachment-api-flow";
import { safeSetLocalStorageItem } from "@/features/demo/prototype-storage";
import { todayIsoDate } from "@/components/prototype-runtime/prototype-runtime-notebook";
import {
  buildEntry,
  isoDaysAgo,
  readOperationalEntries,
} from "@/components/prototype-runtime/prototype-runtime-demo-operational-entries";
import {
  BINDS_TO_SERVER_AUTH,
  ENTRIES_API_DB_SOURCE,
  OPERATIONAL_ENTRIES_STORAGE_KEY,
  REGISTER_ENTRIES_PAGINATION_ENABLED,
} from "@/components/prototype-runtime/prototype-runtime-boot";
import { entryIsActive } from "@/components/prototype-runtime/prototype-runtime-entry-helpers";
import { text } from "@/components/prototype-runtime/prototype-runtime-demo-data";
import { invalidateOperationalData } from "@/core/client/invalidate-operational-data";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";
import { appAlert } from "@/lib/ui/app-dialog/app-dialog-bridge";

export function usePrototypeRuntimeOperationalEntries({
  lang,
  loggedIn,
  runtimeApiStoresReady,
  employee,
  entriesApiEnabled,
  entriesApiStrictMode,
  closeoutsApiOrganizationId,
  apiActorUserId,
  apiActorRole,
  apiTargetStoreIdsKey,
  phase9ApiEnabled,
  setLastCloseoutDates,
}) {
  const queryClient = useQueryClient();
  const [bulkOperationalEntries, setBulkOperationalEntries] = useState(() => readOperationalEntries());
  const [bulkOperationalEntriesLoading, setBulkOperationalEntriesLoading] = useState(false);
  const [operationalEntriesSyncError, setOperationalEntriesSyncError] = useState("");
  const loadOperationalEntriesFromApiRef = useRef(async () => []);

  const shouldDeferOwnerBulkEntriesLoad = !employee
    && REGISTER_ENTRIES_PAGINATION_ENABLED
    && ENTRIES_API_DB_SOURCE;

  const duplicateWatchQueryKey = operationalQueryKeys.entriesDuplicateWatch({
    organizationId: closeoutsApiOrganizationId,
    actorUserId: apiActorUserId,
    actorRole: apiActorRole,
    storeIdsKey: apiTargetStoreIdsKey,
  });

  const duplicateWatchEnabled = loggedIn
    && !employee
    && entriesApiEnabled
    && shouldDeferOwnerBulkEntriesLoad
    && runtimeApiStoresReady
    && isUuid(closeoutsApiOrganizationId)
    && hasCloseoutApiActorMapping(apiActorUserId)
    && Boolean(apiTargetStoreIdsKey);

  const duplicateWatchQuery = useQuery({
    queryKey: duplicateWatchQueryKey,
    queryFn: async () => {
      const targetStoreIds = apiTargetStoreIdsKey ? apiTargetStoreIdsKey.split("|").filter(Boolean) : [];
      if (!targetStoreIds.length) return [];

      const { dateFrom, dateTo, limit } = resolveOwnerDuplicateWatchWindow();
      const fetched = await Promise.all(
        targetStoreIds.map((storeId) => fetchStoreEntriesViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: apiActorUserId,
          actorRole: apiActorRole,
          storeId,
          dateFrom,
          dateTo,
          status: "active",
          limit,
        })),
      );
      const merged = fetched.flatMap((items) => (Array.isArray(items) ? items : []));
      return filterOwnerDuplicateWatchEntries(merged);
    },
    enabled: duplicateWatchEnabled,
  });

  const operationalEntries = shouldDeferOwnerBulkEntriesLoad
    ? (duplicateWatchQuery.data ?? [])
    : bulkOperationalEntries;
  const operationalEntriesLoading = shouldDeferOwnerBulkEntriesLoad
    ? duplicateWatchQuery.isPending
    : bulkOperationalEntriesLoading;
  const setOperationalEntries = setBulkOperationalEntries;

  const createOperationalEntryInApi = useCallback(async ({ payload, actorUserId, actorRole }) => {
    if (!entriesApiEnabled) {
      if (entriesApiStrictMode) throw new Error("entries API is disabled in production mode.");
      return null;
    }
    if (!isUuid(closeoutsApiOrganizationId)) {
      if (entriesApiStrictMode) throw new Error("organization id is missing/invalid for entries API.");
      return null;
    }
    const apiPayload = await resolvePayloadAttachmentForPhase9Api({
      enabled: phase9ApiEnabled,
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      actorRole,
      storeId: payload?.businessId,
      payload,
    });
    return createStoreEntryViaApi({
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      actorRole,
      payload: apiPayload,
    });
  }, [closeoutsApiOrganizationId, entriesApiEnabled, entriesApiStrictMode, phase9ApiEnabled]);

  const loadOperationalEntriesFromApi = useCallback(async (options = {}) => {
    await invalidateOperationalData(queryClient, {
      scopes: options.invalidateScopes ?? "all",
    });

    if (shouldDeferOwnerBulkEntriesLoad) {
      if (!duplicateWatchEnabled) return [];
      await queryClient.refetchQueries({ queryKey: duplicateWatchQueryKey });
      const refreshed = queryClient.getQueryData(duplicateWatchQueryKey);
      return Array.isArray(refreshed) ? refreshed : [];
    }

    if (!entriesApiEnabled) {
      if (entriesApiStrictMode) throw new Error("entries API is disabled in production mode.");
      return [];
    }
    if (!isUuid(closeoutsApiOrganizationId)) {
      const message = lang === "ar"
        ? "تعذر تحميل العمليات: معرف المنظمة غير صالح لمسار API."
        : "Failed to load operations: organization id is missing/invalid for entries API.";
      setOperationalEntriesSyncError(message);
      throw new Error(message);
    }
    if (!hasCloseoutApiActorMapping(apiActorUserId)) {
      const message = lang === "ar"
        ? "تعذر تحميل العمليات: معرف المستخدم غير مربوط بالخادم."
        : "Failed to load operations: actor user id is missing/invalid for entries API.";
      setOperationalEntriesSyncError(message);
      throw new Error(message);
    }

    const targetStoreIds = apiTargetStoreIdsKey ? apiTargetStoreIdsKey.split("|").filter(Boolean) : [];
    setBulkOperationalEntriesLoading(true);
    if (!targetStoreIds.length) {
      setBulkOperationalEntries([]);
      setBulkOperationalEntriesLoading(false);
      return [];
    }

    try {
      const dateTo = todayIsoDate();
      const { lookbackDays, limit: bulkLimit } = resolveOperationalEntriesBulkLoadWindow({
        paginationEnabled: REGISTER_ENTRIES_PAGINATION_ENABLED,
      });
      const dateFrom = isoDaysAgo(lookbackDays);

      const fetched = await Promise.all(
        targetStoreIds.map((storeId) => fetchStoreEntriesViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: apiActorUserId,
          actorRole: apiActorRole,
          storeId,
          dateFrom,
          dateTo,
          status: "all",
          limit: bulkLimit,
        })),
      );

      const merged = fetched.flatMap((items) => (Array.isArray(items) ? items : []));
      const seen = new Set();
      const deduped = merged.filter((item) => {
        const itemId = typeof item?.id === "string" ? item.id : "";
        if (!itemId || seen.has(itemId)) return false;
        seen.add(itemId);
        return true;
      });

      setBulkOperationalEntries(deduped);
      setOperationalEntriesSyncError("");
      return deduped;
    } finally {
      setBulkOperationalEntriesLoading(false);
    }
  }, [
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
    closeoutsApiOrganizationId,
    duplicateWatchEnabled,
    duplicateWatchQueryKey,
    entriesApiEnabled,
    entriesApiStrictMode,
    lang,
    queryClient,
    shouldDeferOwnerBulkEntriesLoad,
  ]);

  loadOperationalEntriesFromApiRef.current = loadOperationalEntriesFromApi;

  const removeOperationalEntriesForCloseout = useCallback((closeoutId, storeId = null) => {
    if (!closeoutId) return;
    setBulkOperationalEntries((current) => {
      const next = current.filter((entry) => entry.closeoutId !== closeoutId);
      if (storeId) {
        const latestActiveCloseoutDate = next
          .filter((entry) => entry.businessId === storeId && entry.type === "summary" && entryIsActive(entry))
          .map((entry) => entry.date)
          .sort()
          .pop();
        setLastCloseoutDates((prev) => {
          const updated = { ...prev };
          if (latestActiveCloseoutDate) updated[storeId] = latestActiveCloseoutDate;
          else delete updated[storeId];
          return updated;
        });
      }
      return next;
    });
  }, [setLastCloseoutDates]);

  const syncCloseoutToOperationalEntries = useCallback(async (closeout, { force = false } = {}) => {
    if (ENTRIES_API_DB_SOURCE) {
      if (typeof loadOperationalEntriesFromApiRef.current === "function") {
        await loadOperationalEntriesFromApiRef.current();
      }
      return;
    }
    if (!closeout) return;
    if (!force && closeout.syncedToEntries) return;
    if (force) {
      removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
    }
    const actor = {
      role: "employee",
      userId: closeout.submittedByUserId || closeout.openedByUserId,
      nameAr: closeout.submittedByName || closeout.openedByName,
      nameEn: closeout.submittedByName || closeout.openedByName,
    };
    const { entries } = buildOperationalEntriesFromCloseout(closeout, actor);
    const created = [];
    for (const item of entries) {
      const entry = buildEntry(item.payload, actor);
      if (item.payload.attachment || item.attachment) {
        const attachmentPayload = item.payload.attachment || item.attachment;
        try {
          await storeAttachmentPayload(attachmentPayload);
          entry.attachment = makeAttachment(entry.id, attachmentPayload);
        } catch {
          await appAlert({ lang, title: text(lang, "attachmentSaveFailed"), variant: "info" });
        }
      }
      created.push(entry);
    }
    if (created.length) {
      setBulkOperationalEntries((current) => [...created, ...current]);
      const summaryEntry = created.find((entry) => entry.type === "summary");
      if (summaryEntry) {
        setLastCloseoutDates((current) => mergeLastCloseoutDateForStore(current, summaryEntry.businessId, summaryEntry.date));
      }
    }
  }, [lang, removeOperationalEntriesForCloseout, setLastCloseoutDates]);

  useEffect(() => {
    if (!loggedIn) return;
    if (employee) return;
    if (!entriesApiEnabled) {
      if (entriesApiStrictMode) {
        setOperationalEntriesSyncError(
          lang === "ar"
            ? "مسار API للسجل التشغيلي غير مفعّل في وضع الإنتاج."
            : "Operational entries API is disabled in production mode.",
        );
      }
      return;
    }
    if (!runtimeApiStoresReady) return;
    if (shouldDeferOwnerBulkEntriesLoad) return;

    loadOperationalEntriesFromApi().catch((error) => {
      console.warn("operational entries API load failed", error);
      setOperationalEntriesSyncError(
        lang === "ar"
          ? "تعذر تحديث السجل التشغيلي من الخادم."
          : "Failed to refresh operational register from server.",
      );
    });
  }, [
    employee,
    entriesApiEnabled,
    entriesApiStrictMode,
    lang,
    loadOperationalEntriesFromApi,
    loggedIn,
    runtimeApiStoresReady,
    shouldDeferOwnerBulkEntriesLoad,
  ]);

  useEffect(() => {
    if (!operationalEntriesSyncError) return;
    console.warn(operationalEntriesSyncError);
  }, [operationalEntriesSyncError]);

  useEffect(() => {
    if (BINDS_TO_SERVER_AUTH || ENTRIES_API_DB_SOURCE || typeof window === "undefined") return;
    safeSetLocalStorageItem(
      OPERATIONAL_ENTRIES_STORAGE_KEY,
      JSON.stringify(stripEmbeddedAttachmentImages(bulkOperationalEntries)),
      { scope: "operational-fallback" },
    );
  }, [bulkOperationalEntries]);

  return {
    operationalEntries,
    setOperationalEntries,
    operationalEntriesLoading,
    operationalEntriesSyncError,
    createOperationalEntryInApi,
    loadOperationalEntriesFromApi,
    syncCloseoutToOperationalEntries,
    removeOperationalEntriesForCloseout,
  };
}