"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  appendCloseoutEvent,
  createDraftCloseout,
  findCloseoutForStoreDate,
  pendingSubmittedCloseouts,
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
  onReviewCloseoutInApi = null,
  loadCloseoutsFromApi = null,
  closeoutReviewRequiredForStore = null,
  apiStrictMode = false,
  dbSourceMode = false,
}) {
  const skipLocalPersistence = apiStrictMode || dbSourceMode;
  const useApiWrites = apiStrictMode || dbSourceMode;

  const [closeouts, setCloseouts] = useState(() => (skipLocalPersistence ? [] : readDailyCloseouts()));
  const [events, setEvents] = useState(() => (skipLocalPersistence ? [] : readCloseoutEvents()));
  const [syncError, setSyncError] = useState("");

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

  const autoApprovePendingCloseoutsWithoutReview = useCallback(async (remoteList) => {
    if (
      !dbSourceMode
      || typeof onReviewCloseoutInApi !== "function"
      || typeof closeoutReviewRequiredForStore !== "function"
    ) {
      return false;
    }

    let repaired = false;
    for (const closeout of remoteList) {
      if (closeout?.status !== CLOSEOUT_STATUS.SUBMITTED) continue;
      if (closeoutReviewRequiredForStore(closeout.storeId)) continue;
      try {
        await onReviewCloseoutInApi({ action: "approve", closeout });
        repaired = true;
      } catch (error) {
        console.warn("closeout auto-approve failed", error);
      }
    }
    return repaired;
  }, [closeoutReviewRequiredForStore, dbSourceMode, onReviewCloseoutInApi]);

  const reloadCloseoutsFromApi = useCallback(async () => {
    if (typeof loadCloseoutsFromApi !== "function") return [];
    let remote = await loadCloseoutsFromApi();
    let remoteList = Array.isArray(remote) ? remote.map((item) => withCloseoutTotals(item)) : [];
    if (await autoApprovePendingCloseoutsWithoutReview(remoteList)) {
      remote = await loadCloseoutsFromApi();
      remoteList = Array.isArray(remote) ? remote.map((item) => withCloseoutTotals(item)) : [];
    }
    setCloseouts((current) => {
      const localDrafts = dbSourceMode || (apiStrictMode && !dbSourceMode)
        ? []
        : current.filter((item) => item.status === CLOSEOUT_STATUS.DRAFT && !item.submittedAt);
      const remoteKeys = new Set(remoteList.map((item) => item.id));
      const remoteStoreDates = new Set(
        remoteList.map((item) => `${item.storeId}:${item.date}`),
      );
      const merged = [
        ...remoteList,
        ...localDrafts.filter((item) => {
          if (remoteKeys.has(item.id)) return false;
          if (remoteStoreDates.has(`${item.storeId}:${item.date}`)) return false;
          return true;
        }),
      ];
      if (!skipLocalPersistence) {
        writeDailyCloseouts(merged);
      }
      return merged;
    });
    setSyncError("");
    return remoteList;
  }, [apiStrictMode, autoApprovePendingCloseoutsWithoutReview, dbSourceMode, loadCloseoutsFromApi, skipLocalPersistence]);

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
    reloadCloseoutsFromApi().catch((error) => {
      console.warn("closeouts initial API load failed", error);
      setSyncError(lang === "ar" ? "تعذر تحديث التقفيلات من الخادم." : "Failed to refresh closeouts from server.");
    });
  }, [lang, loadCloseoutsFromApi, reloadCloseoutsFromApi]);

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

  const submitCloseout = useCallback(async ({ closeout, employee, reviewWorkflowEnabled }) => {
    const saved = saveCloseoutRecord(closeout);
    if (!saved.ok) {
      setSyncError(lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN);
      return { ok: false, phase: "save" };
    }

    const now = new Date().toISOString();
    const employeeName = lang === "ar" ? employee.nameAr : employee.nameEn;
    const autoReview = !reviewWorkflowEnabled;
    const next = withCloseoutTotals({
      ...closeout,
      status: autoReview ? CLOSEOUT_STATUS.REVIEWED : CLOSEOUT_STATUS.SUBMITTED,
      submittedAt: now,
      submittedByUserId: employee.id,
      submittedByName: employeeName,
      reviewedAt: autoReview ? now : null,
      reviewedByName: autoReview ? null : null,
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
            reviewWorkflowEnabled,
          });
          if (!result) {
            setSyncError(lang === "ar" ? CLOSEOUT_SEND_ERROR_AR : CLOSEOUT_SEND_ERROR_EN);
            return { ok: false, phase: "send" };
          }
          setSyncError("");
          if (dbSourceMode) {
            await reloadCloseoutsAndPreserveSubmitted(next);
            if (autoReview) await onSyncToOperationalEntries(next);
            return result;
          }
        } else {
          await onSubmitCloseoutToApi({ action: apiSubmitAction, closeout: next, employee, reviewWorkflowEnabled });
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
      if (autoReview) {
        await onSyncToOperationalEntries(next);
        const synced = saveCloseoutRecord({ ...next, syncedToEntries: true });
        if (!synced.ok) {
          setSyncError(lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN);
          return { ok: false, phase: "save" };
        }
      }
      return next;
    } catch (error) {
      console.warn("closeout submit send failed", error);
      setSyncError(lang === "ar" ? CLOSEOUT_SEND_ERROR_AR : CLOSEOUT_SEND_ERROR_EN);
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

  const resubmitCloseout = useCallback(async ({ closeout, employee, reviewWorkflowEnabled }) => {
    const saved = saveCloseoutRecord(closeout);
    if (!saved.ok) {
      setSyncError(lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN);
      return { ok: false, phase: "save" };
    }

    const now = new Date().toISOString();
    const employeeName = lang === "ar" ? employee.nameAr : employee.nameEn;
    const autoReview = !reviewWorkflowEnabled;
    const next = withCloseoutTotals({
      ...closeout,
      status: autoReview ? CLOSEOUT_STATUS.REVIEWED : CLOSEOUT_STATUS.SUBMITTED,
      submittedAt: now,
      submittedByUserId: employee.id,
      submittedByName: employeeName,
      returnedAt: null,
      returnedByName: null,
      returnReason: null,
      reviewedAt: autoReview ? now : null,
      reviewedByName: null,
    });
    const apiSubmitAction = "resubmit";

    try {
      if (typeof onSubmitCloseoutToApi === "function") {
        if (useApiWrites) {
          const result = await onSubmitCloseoutToApi({
            action: apiSubmitAction,
            closeout: next,
            employee,
            reviewWorkflowEnabled,
          });
          if (!result) {
            setSyncError(lang === "ar" ? CLOSEOUT_SEND_ERROR_AR : CLOSEOUT_SEND_ERROR_EN);
            return { ok: false, phase: "send" };
          }
          setSyncError("");
          if (dbSourceMode) {
            await reloadCloseoutsAndPreserveSubmitted(next);
            if (autoReview) await onSyncToOperationalEntries(next);
            return result;
          }
        } else {
          await onSubmitCloseoutToApi({ action: apiSubmitAction, closeout: next, employee, reviewWorkflowEnabled });
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
        type: "resubmitted",
        closeoutId: next.id,
        storeId: next.storeId,
        storeName: next.storeName,
        date: next.date,
        dateLabel: next.date,
        actorName: employeeName,
        employeeName,
      });
      if (autoReview) {
        await onSyncToOperationalEntries(next);
        const synced = saveCloseoutRecord({ ...next, syncedToEntries: true });
        if (!synced.ok) {
          setSyncError(lang === "ar" ? CLOSEOUT_SAVE_ERROR_AR : CLOSEOUT_SAVE_ERROR_EN);
          return { ok: false, phase: "save" };
        }
      }
      return next;
    } catch (error) {
      console.warn("closeout resubmit send failed", error);
      setSyncError(lang === "ar" ? CLOSEOUT_SEND_ERROR_AR : CLOSEOUT_SEND_ERROR_EN);
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

  const approveCloseout = useCallback(async (closeoutId, reviewerName) => {
    const target = closeouts.find((item) => item.id === closeoutId);
    if (!target || target.status !== CLOSEOUT_STATUS.SUBMITTED) return null;
    const now = new Date().toISOString();
    const next = withCloseoutTotals({
      ...target,
      status: CLOSEOUT_STATUS.REVIEWED,
      reviewedAt: now,
      reviewedByName: reviewerName,
    });
    if (typeof onReviewCloseoutInApi === "function") {
      if (useApiWrites) {
        try {
          const result = await onReviewCloseoutInApi({ action: "approve", closeout: next, reviewerName });
          if (!result) {
            setSyncError(lang === "ar" ? "تعذر اعتماد التقفيلة على الخادم." : "Failed to approve closeout on server.");
            return null;
          }
          setSyncError("");
          if (dbSourceMode) {
            await reloadCloseoutsFromApi();
            await onSyncToOperationalEntries(next);
            return result;
          }
        } catch (error) {
          console.warn("closeout approve API sync failed", error);
          setSyncError(lang === "ar" ? "تعذر اعتماد التقفيلة على الخادم." : "Failed to approve closeout on server.");
          return null;
        }
      } else {
        try {
          await onReviewCloseoutInApi({ action: "approve", closeout: next, reviewerName });
        } catch (error) {
          console.warn("closeout approve API sync failed", error);
        }
      }
    } else if (useApiWrites) {
      setSyncError(
        lang === "ar"
          ? "مسار API للمراجعة غير مهيأ في وضع الإنتاج."
          : "Closeout review API path is not configured in production mode.",
      );
      return null;
    }
    upsertCloseout(next);
    logEvent({
      type: "approved",
      closeoutId: next.id,
      storeId: next.storeId,
      storeName: next.storeName,
      date: next.date,
      dateLabel: next.date,
      employeeName: next.submittedByName,
      actorName: reviewerName,
    });
    await onSyncToOperationalEntries(next);
    upsertCloseout({ ...next, syncedToEntries: true });
    return next;
  }, [closeouts, dbSourceMode, lang, logEvent, onReviewCloseoutInApi, onSyncToOperationalEntries, reloadCloseoutsFromApi, upsertCloseout, useApiWrites]);

  const returnCloseout = useCallback(async (closeoutId, reviewerName, reason) => {
    const target = closeouts.find((item) => item.id === closeoutId);
    if (!target || target.status !== CLOSEOUT_STATUS.SUBMITTED) return null;
    const now = new Date().toISOString();
    const next = withCloseoutTotals({
      ...target,
      status: CLOSEOUT_STATUS.RETURNED,
      returnedAt: now,
      returnedByName: reviewerName,
      returnReason: reason,
    });
    if (typeof onReviewCloseoutInApi === "function") {
      if (useApiWrites) {
        try {
          const result = await onReviewCloseoutInApi({ action: "return", closeout: next, reviewerName, reason });
          if (!result) {
            setSyncError(lang === "ar" ? "تعذر إرجاع التقفيلة على الخادم." : "Failed to return closeout on server.");
            return null;
          }
          setSyncError("");
          if (dbSourceMode) {
            await reloadCloseoutsFromApi();
            return result;
          }
        } catch (error) {
          console.warn("closeout return API sync failed", error);
          setSyncError(lang === "ar" ? "تعذر إرجاع التقفيلة على الخادم." : "Failed to return closeout on server.");
          return null;
        }
      } else {
        try {
          await onReviewCloseoutInApi({ action: "return", closeout: next, reviewerName, reason });
        } catch (error) {
          console.warn("closeout return API sync failed", error);
        }
      }
    } else if (useApiWrites) {
      setSyncError(
        lang === "ar"
          ? "مسار API للمراجعة غير مهيأ في وضع الإنتاج."
          : "Closeout review API path is not configured in production mode.",
      );
      return null;
    }
    upsertCloseout(next);
    logEvent({
      type: "returned",
      closeoutId: next.id,
      storeId: next.storeId,
      storeName: next.storeName,
      date: next.date,
      dateLabel: next.date,
      employeeName: next.submittedByName,
      actorName: reviewerName,
      reason,
    });
    return next;
  }, [closeouts, dbSourceMode, lang, logEvent, onReviewCloseoutInApi, reloadCloseoutsFromApi, upsertCloseout, useApiWrites]);

  const value = useMemo(() => ({
    closeouts: sortCloseoutsNewestFirst(closeouts),
    events,
    pendingSubmittedCloseouts: (storeIds, reviewEnabledForStore) => pendingSubmittedCloseouts(closeouts, storeIds, reviewEnabledForStore),
    deleteCloseout,
    upsertCloseout,
    openOrResumeDraft,
    submitCloseout,
    resubmitCloseout,
    approveCloseout,
    returnCloseout,
    findForStoreDate: (storeId, date) => findCloseoutForStoreDate(closeouts, storeId, date),
    syncError,
    reloadCloseoutsFromApi,
  }), [approveCloseout, closeouts, deleteCloseout, events, openOrResumeDraft, reloadCloseoutsFromApi, resubmitCloseout, returnCloseout, submitCloseout, syncError, upsertCloseout]);

  return <DailyCloseoutsContext.Provider value={value}>{children}</DailyCloseoutsContext.Provider>;
}
