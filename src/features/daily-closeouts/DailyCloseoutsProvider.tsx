"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  appendCloseoutEvent,
  createDraftCloseout,
  findCloseoutForStoreDate,
  findCloseoutsForStoreDate,
  isLocalDraftCloseout,
  readCloseoutEvents,
  readDailyCloseouts,
  sortCloseoutsNewestFirst,
  withCloseoutTotals,
  writeDailyCloseouts,
} from "./daily-closeouts-demo-store";
import { resolveEmployeeDisplayName } from "@/features/employee-closeouts/employee-portal-session";
import { mapCloseoutSyncErrorToUserMessage } from "@/features/closeouts/client/closeout-sync-errors";
import { CLOSEOUT_STATUS } from "./closeout-status";
import type {
  CloseoutEvent,
  CloseoutSubmitResult,
  CloseoutSyncLang,
  CloseoutWorkflowFailure,
  CloseoutWorkflowPhase,
  DailyCloseoutRecord,
  DailyCloseoutsContextValue,
  DailyCloseoutsProviderProps,
  StorageWriteResult,
} from "./daily-closeouts-types";

const CLOSEOUT_SAVE_ERROR_AR = "تعذر الحفظ.";
const CLOSEOUT_SAVE_ERROR_EN = "Failed to save.";
const CLOSEOUT_SEND_ERROR_AR = "تعذر الإرسال.";
const CLOSEOUT_SEND_ERROR_EN = "Failed to send.";

function resolveCloseoutWorkflowErrorMessage(
  error: unknown,
  lang: CloseoutSyncLang,
  phase: CloseoutWorkflowPhase,
): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (phase === "save") return lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN;
  return lang === "ar" ? CLOSEOUT_SEND_ERROR_AR : CLOSEOUT_SEND_ERROR_EN;
}

const DailyCloseoutsContext = createContext<DailyCloseoutsContextValue | null>(null);

export function useDailyCloseouts(): DailyCloseoutsContextValue {
  const ctx = useContext(DailyCloseoutsContext);
  if (!ctx) throw new Error("useDailyCloseouts must be used within DailyCloseoutsProvider");
  return ctx;
}

export function DailyCloseoutsProvider({
  children,
  lang = "ar",
  ownerName: _ownerName = "",
  onSyncToOperationalEntries = async () => {},
  onSubmitCloseoutToApi = null,
  onDeleteCloseoutToApi = null,
  loadCloseoutsFromApi = null,
  closeoutsAutoLoadQueryKey = "",
  apiStrictMode = false,
  dbSourceMode = false,
}: DailyCloseoutsProviderProps) {
  const skipLocalPersistence = apiStrictMode || dbSourceMode;
  const useApiWrites = apiStrictMode || dbSourceMode;
  const usesCloseoutsApi = typeof loadCloseoutsFromApi === "function";

  const [closeouts, setCloseouts] = useState<DailyCloseoutRecord[]>(
    () => (skipLocalPersistence ? [] : readDailyCloseouts()),
  );
  const [events, setEvents] = useState<CloseoutEvent[]>(
    () => (skipLocalPersistence ? [] : readCloseoutEvents()),
  );
  const [syncError, setSyncError] = useState("");
  const [closeoutsLoading, setCloseoutsLoading] = useState(
    () => usesCloseoutsApi && Boolean(closeoutsAutoLoadQueryKey),
  );
  const [closeoutsLoaded, setCloseoutsLoaded] = useState(() => !usesCloseoutsApi);
  const lastAutoLoadQueryKeyRef = useRef("");
  const loadedContextRef = useRef("");

  const persistCloseouts = useCallback((next: DailyCloseoutRecord[] | ((current: DailyCloseoutRecord[]) => DailyCloseoutRecord[])) => {
    let storageResult: StorageWriteResult = { ok: true };
    setCloseouts((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      if (!skipLocalPersistence) {
        storageResult = writeDailyCloseouts(resolved);
      }
      return resolved;
    });
    return storageResult;
  }, [skipLocalPersistence]);

  const logEvent = useCallback((payload: Omit<CloseoutEvent, "id" | "at">) => {
    setEvents((current) => (skipLocalPersistence ? current : appendCloseoutEvent(current, payload)));
  }, [skipLocalPersistence]);

  const deleteCloseout = useCallback(async (closeoutId: string, closeoutMeta: DailyCloseoutRecord | null = null) => {
    const target = closeoutMeta || closeouts.find((item) => item.id === closeoutId) || null;
    const skipApiDelete = isLocalDraftCloseout(target);
    if (!skipApiDelete && typeof onDeleteCloseoutToApi === "function" && useApiWrites && target) {
      await onDeleteCloseoutToApi({ closeout: target });
    }
    persistCloseouts((current) => current.filter((item) => item.id !== closeoutId));
  }, [closeouts, onDeleteCloseoutToApi, persistCloseouts, useApiWrites]);

  const upsertCloseout = useCallback((nextCloseout: DailyCloseoutRecord) => {
    const normalized = withCloseoutTotals(nextCloseout);
    persistCloseouts((current) => {
      const index = current.findIndex((item) => item.id === normalized.id);
      if (index === -1) return [normalized, ...current];
      const copy = [...current];
      copy[index] = normalized;
      return copy;
    });
    return normalized;
  }, [persistCloseouts]);

  const saveCloseoutRecord = useCallback((closeout: DailyCloseoutRecord): CloseoutWorkflowFailure | { ok: true; closeout: DailyCloseoutRecord } => {
    if (!closeout?.id || !closeout?.storeId || !closeout?.date) {
      return { ok: false, phase: "save" };
    }
    try {
      const normalized = withCloseoutTotals(closeout);
      const storageResult = persistCloseouts((current) => {
        const index = current.findIndex((item) => item.id === normalized.id);
        if (index === -1) return [normalized, ...current];
        const copy = [...current];
        copy[index] = normalized;
        return copy;
      });
      if (!storageResult.ok) {
        return { ok: false, phase: "save" };
      }
      return { ok: true, closeout: normalized };
    } catch (error) {
      console.warn("closeout save failed", error);
      return { ok: false, phase: "save" };
    }
  }, [persistCloseouts]);

  const reloadCloseoutsFromApi = useCallback(async (): Promise<DailyCloseoutRecord[]> => {
    if (typeof loadCloseoutsFromApi !== "function") return [];
    const contextKey = closeoutsAutoLoadQueryKey || "default";
    const contextChanged = loadedContextRef.current !== "" && loadedContextRef.current !== contextKey;

    setCloseoutsLoading(true);
    if (contextChanged) {
      setCloseouts([]);
      setCloseoutsLoaded(false);
    }

    try {
      const remote = await loadCloseoutsFromApi();
      const remoteList = Array.isArray(remote)
        ? remote.map((item) => withCloseoutTotals(item as DailyCloseoutRecord))
        : [];
      setCloseouts((current) => {
        const localDrafts = dbSourceMode || (apiStrictMode && !dbSourceMode)
          ? []
          : current.filter((item) => item.status === CLOSEOUT_STATUS.DRAFT && !item.submittedAt);
        const remoteKeys = new Set(remoteList.map((item) => item.id));
        const merged = [
          ...remoteList,
          ...localDrafts.filter((item) => !remoteKeys.has(item.id)),
        ];
        if (!skipLocalPersistence) {
          writeDailyCloseouts(merged);
        }
        return merged;
      });
      setCloseoutsLoaded(true);
      loadedContextRef.current = contextKey;
      setSyncError("");
      return remoteList;
    } catch (error) {
      if (loadedContextRef.current !== contextKey) {
        setCloseoutsLoaded(false);
      }
      throw error;
    } finally {
      setCloseoutsLoading(false);
    }
  }, [
    apiStrictMode,
    closeoutsAutoLoadQueryKey,
    dbSourceMode,
    loadCloseoutsFromApi,
    skipLocalPersistence,
  ]);

  const reloadCloseoutsAndPreserveSubmitted = useCallback(async (submittedCloseout: DailyCloseoutRecord) => {
    const remoteList = await reloadCloseoutsFromApi();
    const inRemote = remoteList.some(
      (item) => item.id === submittedCloseout?.id && item.date === submittedCloseout?.date,
    );
    if (!inRemote && submittedCloseout?.id) {
      upsertCloseout(submittedCloseout);
    }
    return remoteList;
  }, [reloadCloseoutsFromApi, upsertCloseout]);

  const runPostSubmitBackgroundSync = useCallback((submittedCloseout: DailyCloseoutRecord) => {
    void (async () => {
      try {
        await reloadCloseoutsAndPreserveSubmitted(submittedCloseout);
        await onSyncToOperationalEntries(submittedCloseout);
      } catch (error) {
        console.warn("closeout post-submit background sync failed", error);
        const fallback = lang === "ar"
          ? "تم الإرسال؛ تعذر تحديث القائمة من الخادم."
          : "Submitted; failed to refresh list from server.";
        const detail = error instanceof Error && error.message.trim()
          ? mapCloseoutSyncErrorToUserMessage(error, lang)
          : "";
        setSyncError(detail || fallback);
      }
    })();
  }, [lang, onSyncToOperationalEntries, reloadCloseoutsAndPreserveSubmitted]);

  useEffect(() => {
    if (typeof loadCloseoutsFromApi !== "function") return;
    const queryKey = closeoutsAutoLoadQueryKey || "default";
    if (!queryKey || queryKey === "default") return;
    if (lastAutoLoadQueryKeyRef.current === queryKey) return;
    lastAutoLoadQueryKeyRef.current = queryKey;
    setCloseoutsLoading(true);
    reloadCloseoutsFromApi().catch((error) => {
      console.warn("closeouts initial API load failed", error);
      const fallback = lang === "ar"
        ? "تعذر تحديث التقفيلات من الخادم."
        : "Failed to refresh closeouts from server.";
      const detail = error instanceof Error && error.message.trim()
        ? mapCloseoutSyncErrorToUserMessage(error, lang)
        : "";
      setSyncError(detail || fallback);
    });
  }, [closeoutsAutoLoadQueryKey, lang, loadCloseoutsFromApi, reloadCloseoutsFromApi]);

  const openOrResumeDraft = useCallback(({ store, date, employee }: Parameters<DailyCloseoutsContextValue["openOrResumeDraft"]>[0]) => {
    const draft = createDraftCloseout({
      storeId: store.id,
      storeName: store.nameAr || store.nameEn || store.id,
      date,
      employee: { id: employee.id, nameAr: employee.nameAr, nameEn: employee.nameEn },
    });
    upsertCloseout(draft);
    logEvent({
      type: "opened",
      closeoutId: draft.id,
      storeId: store.id,
      storeName: draft.storeName,
      date: draft.date,
      dateLabel: draft.date,
      actorName: resolveEmployeeDisplayName(employee, lang),
    });
    return draft;
  }, [lang, logEvent, upsertCloseout]);

  const submitCloseout = useCallback(async ({ closeout, employee }: Parameters<DailyCloseoutsContextValue["submitCloseout"]>[0]): Promise<CloseoutSubmitResult> => {
    const saved = saveCloseoutRecord(closeout);
    if (!saved.ok) {
      setSyncError(lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN);
      return { ok: false, phase: "save" };
    }

    const now = new Date().toISOString();
    const employeeName = resolveEmployeeDisplayName(employee, lang);
    const next = withCloseoutTotals({
      ...closeout,
      status: CLOSEOUT_STATUS.REVIEWED,
      submittedAt: now,
      submittedByUserId: employee.id,
      submittedByName: employeeName,
      reviewedAt: now,
      reviewedByName: null,
      returnedAt: null,
      returnedByName: null,
      returnReason: null,
    });
    const apiSubmitAction = "submit";

    try {
      if (typeof onSubmitCloseoutToApi === "function") {
        if (useApiWrites) {
          const result = await onSubmitCloseoutToApi({
            action: apiSubmitAction,
            closeout: next,
            employee,
          });
          if (!result) {
            setSyncError(lang === "ar" ? CLOSEOUT_SEND_ERROR_AR : CLOSEOUT_SEND_ERROR_EN);
            return { ok: false, phase: "send" };
          }
          setSyncError("");
          if (dbSourceMode) {
            upsertCloseout(next);
            runPostSubmitBackgroundSync(next);
            return next;
          }
        } else {
          await onSubmitCloseoutToApi({ action: apiSubmitAction, closeout: next, employee });
        }
      } else if (useApiWrites) {
        setSyncError(lang === "ar" ? CLOSEOUT_SEND_ERROR_AR : CLOSEOUT_SEND_ERROR_EN);
        return { ok: false, phase: "send" };
      }

      const persisted = saveCloseoutRecord(next);
      if (!persisted.ok) {
        setSyncError(lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN);
        return { ok: false, phase: "save" };
      }

      logEvent({
        type: "submitted",
        closeoutId: next.id,
        storeId: next.storeId,
        storeName: next.storeName,
        date: next.date,
        dateLabel: next.date,
        actorName: employeeName,
        employeeName,
      });
      await onSyncToOperationalEntries(next);
      const synced = saveCloseoutRecord({ ...next, syncedToEntries: true });
      if (!synced.ok) {
        setSyncError(lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN);
        return { ok: false, phase: "save" };
      }
      return next;
    } catch (error) {
      console.warn("closeout submit send failed", error);
      setSyncError(resolveCloseoutWorkflowErrorMessage(error, lang, "send"));
      return { ok: false, phase: "send" };
    }
  }, [
    dbSourceMode,
    lang,
    logEvent,
    onSubmitCloseoutToApi,
    onSyncToOperationalEntries,
    runPostSubmitBackgroundSync,
    saveCloseoutRecord,
    upsertCloseout,
    useApiWrites,
  ]);

  const ownerEditCloseout = useCallback(async ({ closeout, employee }: Parameters<DailyCloseoutsContextValue["ownerEditCloseout"]>[0]): Promise<CloseoutSubmitResult> => {
    const saved = saveCloseoutRecord(closeout);
    if (!saved.ok) {
      setSyncError(lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN);
      return { ok: false, phase: "save" };
    }

    const now = new Date().toISOString();
    const employeeName = resolveEmployeeDisplayName(employee, lang);
    const next = withCloseoutTotals({
      ...closeout,
      status: CLOSEOUT_STATUS.REVIEWED,
      submittedAt: now,
      submittedByUserId: employee.id,
      submittedByName: employeeName,
      returnedAt: null,
      returnedByName: null,
      returnReason: null,
      reviewedAt: now,
      reviewedByName: null,
      ownerEditedAt: now,
      ownerEditedByUserId: employee.id,
      ownerEditedByName: employeeName,
    });
    const apiSubmitAction = "ownerEdit";

    try {
      if (typeof onSubmitCloseoutToApi === "function") {
        if (useApiWrites) {
          const result = await onSubmitCloseoutToApi({
            action: apiSubmitAction,
            closeout: next,
            employee,
          });
          if (!result) {
            setSyncError(lang === "ar" ? CLOSEOUT_SEND_ERROR_AR : CLOSEOUT_SEND_ERROR_EN);
            return { ok: false, phase: "send" };
          }
          setSyncError("");
          if (dbSourceMode) {
            upsertCloseout(next);
            runPostSubmitBackgroundSync(next);
            return next;
          }
        } else {
          await onSubmitCloseoutToApi({ action: apiSubmitAction, closeout: next, employee });
        }
      } else if (useApiWrites) {
        setSyncError(lang === "ar" ? CLOSEOUT_SEND_ERROR_AR : CLOSEOUT_SEND_ERROR_EN);
        return { ok: false, phase: "send" };
      }

      const persisted = saveCloseoutRecord(next);
      if (!persisted.ok) {
        setSyncError(lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN);
        return { ok: false, phase: "save" };
      }

      logEvent({
        type: "ownerEdit",
        closeoutId: next.id,
        storeId: next.storeId,
        storeName: next.storeName,
        date: next.date,
        dateLabel: next.date,
        actorName: employeeName,
        employeeName,
      });
      await onSyncToOperationalEntries(next);
      const synced = saveCloseoutRecord({ ...next, syncedToEntries: true });
      if (!synced.ok) {
        setSyncError(lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN);
        return { ok: false, phase: "save" };
      }
      return next;
    } catch (error) {
      console.warn("closeout owner edit send failed", error);
      setSyncError(resolveCloseoutWorkflowErrorMessage(error, lang, "send"));
      return { ok: false, phase: "send" };
    }
  }, [
    dbSourceMode,
    lang,
    logEvent,
    onSubmitCloseoutToApi,
    onSyncToOperationalEntries,
    runPostSubmitBackgroundSync,
    saveCloseoutRecord,
    upsertCloseout,
    useApiWrites,
  ]);

  const closeoutsHasData = closeouts.length > 0;

  const value = useMemo<DailyCloseoutsContextValue>(() => ({
    closeouts: sortCloseoutsNewestFirst(closeouts),
    events,
    pendingOwnerCloseoutQueue: () => [],
    deleteCloseout,
    upsertCloseout,
    openOrResumeDraft,
    submitCloseout,
    ownerEditCloseout,
    findForStoreDate: (storeId: string, date: string) => findCloseoutForStoreDate(closeouts, storeId, date),
    findAllForStoreDate: (storeId: string, date: string) => findCloseoutsForStoreDate(closeouts, storeId, date),
    syncError,
    reloadCloseoutsFromApi,
    usesCloseoutsApi,
    closeoutsLoading,
    closeoutsLoaded,
    closeoutsHasData,
  }), [
    closeouts,
    closeoutsHasData,
    closeoutsLoaded,
    closeoutsLoading,
    deleteCloseout,
    events,
    openOrResumeDraft,
    reloadCloseoutsFromApi,
    ownerEditCloseout,
    submitCloseout,
    syncError,
    upsertCloseout,
    usesCloseoutsApi,
  ]);

  return <DailyCloseoutsContext.Provider value={value}>{children}</DailyCloseoutsContext.Provider>;
}
