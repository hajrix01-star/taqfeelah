"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
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
}) {
  const [closeouts, setCloseouts] = useState(() => readDailyCloseouts());
  const [events, setEvents] = useState(() => readCloseoutEvents());

  const persistCloseouts = useCallback((next) => {
    setCloseouts((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      writeDailyCloseouts(resolved);
      return resolved;
    });
  }, []);

  const logEvent = useCallback((payload) => {
    setEvents((current) => appendCloseoutEvent(current, payload));
  }, []);

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
    upsertCloseout(next);
    const apiSubmitAction = "submit";
    logEvent({
      type: autoReview ? "submitted" : "submitted",
      closeoutId: next.id,
      storeId: next.storeId,
      storeName: next.storeName,
      date: next.date,
      dateLabel: next.date,
      actorName: employeeName,
      employeeName,
    });
    if (typeof onSubmitCloseoutToApi === "function") {
      try {
        await onSubmitCloseoutToApi({ action: apiSubmitAction, closeout: next, employee, reviewWorkflowEnabled });
      } catch (error) {
        console.warn("closeout submit API sync failed", error);
      }
    }
    if (autoReview) {
      await onSyncToOperationalEntries(next);
      upsertCloseout({ ...next, syncedToEntries: true });
    }
    return next;
  }, [lang, logEvent, onSubmitCloseoutToApi, onSyncToOperationalEntries, upsertCloseout]);

  const resubmitCloseout = useCallback(async ({ closeout, employee, reviewWorkflowEnabled }) => {
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
    upsertCloseout(next);
    const apiSubmitAction = "resubmit";
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
    if (typeof onSubmitCloseoutToApi === "function") {
      try {
        await onSubmitCloseoutToApi({ action: apiSubmitAction, closeout: next, employee, reviewWorkflowEnabled });
      } catch (error) {
        console.warn("closeout resubmit API sync failed", error);
      }
    }
    if (autoReview) {
      await onSyncToOperationalEntries(next);
      upsertCloseout({ ...next, syncedToEntries: true });
    }
    return next;
  }, [lang, logEvent, onSubmitCloseoutToApi, onSyncToOperationalEntries, upsertCloseout]);

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
    if (typeof onReviewCloseoutInApi === "function") {
      try {
        await onReviewCloseoutInApi({ action: "approve", closeout: next, reviewerName });
      } catch (error) {
        console.warn("closeout approve API sync failed", error);
      }
    }
    await onSyncToOperationalEntries(next);
    upsertCloseout({ ...next, syncedToEntries: true });
    return next;
  }, [closeouts, logEvent, onReviewCloseoutInApi, onSyncToOperationalEntries, upsertCloseout]);

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
    if (typeof onReviewCloseoutInApi === "function") {
      try {
        await onReviewCloseoutInApi({ action: "return", closeout: next, reviewerName, reason });
      } catch (error) {
        console.warn("closeout return API sync failed", error);
      }
    }
    return next;
  }, [closeouts, logEvent, onReviewCloseoutInApi, upsertCloseout]);

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
  }), [approveCloseout, closeouts, deleteCloseout, events, openOrResumeDraft, resubmitCloseout, returnCloseout, submitCloseout, upsertCloseout]);

  return <DailyCloseoutsContext.Provider value={value}>{children}</DailyCloseoutsContext.Provider>;
}
