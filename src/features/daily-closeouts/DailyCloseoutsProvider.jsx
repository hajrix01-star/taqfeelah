"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  appendCloseoutEvent,
  createDraftCloseout,
  findCloseoutForStoreDate,
  findCloseoutsForStoreDate,
  readCloseoutEvents,
  readDailyCloseouts,
  sortCloseoutsNewestFirst,
  withCloseoutTotals,
  writeDailyCloseouts,
} from "./daily-closeouts-demo-store";

const CLOSEOUT_SAVE_ERROR_AR = "تعذر الحفظ.";
const CLOSEOUT_SAVE_ERROR_EN = "Failed to save.";
const CLOSEOUT_SEND_ERROR_AR = "تعذر الإرسال.";
const CLOSEOUT_SEND_ERROR_EN = "Failed to send.";
import { CLOSEOUT_STATUS } from "./closeout-status";

function resolveCloseoutWorkflowErrorMessage(error, lang, phase) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (phase === "save") return lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN;
  return lang === "ar" ? CLOSEOUT_SEND_ERROR_AR : CLOSEOUT_SEND_ERROR_EN;
}

const DailyCloseoutsContext = createContext(null);

export function useDailyCloseouts() {
  const ctx = useContext(DailyCloseoutsContext);
  if (!ctx) throw new Error("useDailyCloseouts must be used within DailyCloseoutsProvider");
  return ctx;
}

export function DailyCloseoutsProvider({
  children,
  lang = "ar",
  ownerName = "",
  onSyncToOperationalEntries = async () => {},
  onSubmitCloseoutToApi = null,
  loadCloseoutsFromApi = null,
  closeoutsAutoLoadQueryKey = "",
  apiStrictMode = false,
  dbSourceMode = false,
}) {
  const skipLocalPersistence = apiStrictMode || dbSourceMode;
  const useApiWrites = apiStrictMode || dbSourceMode;
  const usesCloseoutsApi = typeof loadCloseoutsFromApi === "function";

  const [closeouts, setCloseouts] = useState(() => (skipLocalPersistence ? [] : readDailyCloseouts()));
  const [events, setEvents] = useState(() => (skipLocalPersistence ? [] : readCloseoutEvents()));
  const [syncError, setSyncError] = useState("");
  const [closeoutsLoading, setCloseoutsLoading] = useState(
    () => usesCloseoutsApi && Boolean(closeoutsAutoLoadQueryKey),
  );
  const [closeoutsLoaded, setCloseoutsLoaded] = useState(() => !usesCloseoutsApi);
  const lastAutoLoadQueryKeyRef = useRef("");
  const loadedContextRef = useRef("");

  const persistCloseouts = useCallback((next) => {
    let storageResult = { ok: true };
    setCloseouts((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      if (!skipLocalPersistence) {
        storageResult = writeDailyCloseouts(resolved);
      }
      return resolved;
    });
    return storageResult;
  }, [skipLocalPersistence]);

  const logEvent = useCallback((payload) => {
    setEvents((current) => (skipLocalPersistence ? current : appendCloseoutEvent(current, payload)));
  }, [skipLocalPersistence]);

  const deleteCloseout = useCallback((closeoutId) => {
    persistCloseouts((current) => current.filter((item) => item.id !== closeoutId));
  }, [persistCloseouts]);

  const upsertCloseout = useCallback((nextCloseout) => {
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

  const saveCloseoutRecord = useCallback((closeout) => {
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

  const reloadCloseoutsFromApi = useCallback(async () => {
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
      const remoteList = Array.isArray(remote) ? remote.map((item) => withCloseoutTotals(item)) : [];
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

  const reloadCloseoutsAndPreserveSubmitted = useCallback(async (submittedCloseout) => {
    const remoteList = await reloadCloseoutsFromApi();
    const inRemote = remoteList.some(
      (item) => item.id === submittedCloseout?.id && item.date === submittedCloseout?.date,
    );
    if (!inRemote && submittedCloseout?.id) {
      upsertCloseout(submittedCloseout);
    }
    return remoteList;
  }, [reloadCloseoutsFromApi, upsertCloseout]);

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
      const detail = error instanceof Error && error.message.trim() ? error.message.trim() : "";
      setSyncError(detail || fallback);
    });
  }, [closeoutsAutoLoadQueryKey, lang, loadCloseoutsFromApi, reloadCloseoutsFromApi]);

  const openOrResumeDraft = useCallback(({ store, date, employee }) => {
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
      actorName: lang === "ar" ? employee.nameAr : employee.nameEn,
    });
    return draft;
  }, [lang, logEvent, upsertCloseout]);

  const submitCloseout = useCallback(async ({ closeout, employee }) => {
    const saved = saveCloseoutRecord(closeout);
    if (!saved.ok) {
      setSyncError(lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN);
      return { ok: false, phase: "save" };
    }

    const now = new Date().toISOString();
    const employeeName = lang === "ar" ? employee.nameAr : employee.nameEn;
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
            await reloadCloseoutsAndPreserveSubmitted(next);
            await onSyncToOperationalEntries(next);
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
    reloadCloseoutsAndPreserveSubmitted,
    saveCloseoutRecord,
    useApiWrites,
  ]);

  const ownerEditCloseout = useCallback(async ({ closeout, employee }) => {
    const saved = saveCloseoutRecord(closeout);
    if (!saved.ok) {
      setSyncError(lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN);
      return { ok: false, phase: "save" };
    }

    const now = new Date().toISOString();
    const employeeName = lang === "ar" ? employee.nameAr : employee.nameEn;
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
            await reloadCloseoutsAndPreserveSubmitted(next);
            await onSyncToOperationalEntries(next);
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
    reloadCloseoutsAndPreserveSubmitted,
    saveCloseoutRecord,
    useApiWrites,
  ]);

  const closeoutsHasData = closeouts.length > 0;

  const value = useMemo(() => ({
    closeouts: sortCloseoutsNewestFirst(closeouts),
    events,
    pendingOwnerCloseoutQueue: () => [],
    deleteCloseout,
    upsertCloseout,
    openOrResumeDraft,
    submitCloseout,
    ownerEditCloseout,
    findForStoreDate: (storeId, date) => findCloseoutForStoreDate(closeouts, storeId, date),
    findAllForStoreDate: (storeId, date) => findCloseoutsForStoreDate(closeouts, storeId, date),
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
