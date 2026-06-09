"use client";

import { useCallback } from "react";
import {
  reviewStoreEntryViaApi,
  restoreStoreEntryViaApi,
  voidStoreEntryViaApi,
} from "@/features/entries/client/store-entries-api-client";
import {
  acknowledgeDuplicateSummariesViaApi,
  approveDuplicateSummaryViaApi,
} from "@/features/phase9/client/phase9-api-client";
import { resolvePayloadAttachmentForPhase9Api } from "@/features/phase9/client/inline-attachment-api-flow";
import { resolveLatestActiveCloseoutDateFromEntries } from "@/features/operations/operational-entry-save-helpers";
import {
  applyDuplicateApprovedAudit,
  applyRestoreToEntry,
  applyReviewToEntry,
  applyVoidToEntry,
  canRestoreOperationalEntry,
  canVoidOperationalEntry,
  duplicateSalesGroupKey,
  duplicateSalesSignature,
  mapOperationalEntryMutation,
  mergeLastCloseoutDateAfterSummaryRestore,
  mergeLastCloseoutDateAfterSummaryVoid,
  resolveDuplicateSummaryAcknowledgeFailureMessage,
  resolveDuplicateSummaryApproveFailureMessage,
  resolveOperationalEntryRestoreFailureMessage,
  resolveOperationalEntryReviewFailureMessage,
  resolveOperationalEntryVoidFailureMessage,
} from "@/features/operations/operational-entry-mutation-helpers";
import { duplicateSummaryBlockedInDbSourceMessage } from "@/features/operations/client/closeout-required-entry-message";
import {
  resolveOwnerOperationOpenAction,
  resolveRestoreOperationTarget,
  resolveVoidOperationTarget,
} from "./register-operations-selection.js";

export function useRegisterOperationsState({
  lang,
  setSelected = () => {},
  voidTarget = null,
  setVoidTarget = () => {},
  restoreTarget = null,
  setRestoreTarget = () => {},
  pendingDuplicateSummary = null,
  setPendingDuplicateSummary = () => {},
  operationalEntries = [],
  archivedBusinessIds = [],
  entriesApiEnabled = false,
  entriesApiDbSource = false,
  phase9ApiEnabled = false,
  closeoutsApiOrganizationId = "",
  ownerApiUserId = "",
  currentOwnerActor,
  activeEmployee = null,
  entryIsActive = () => true,
  entryIsVoided = () => false,
  bindsToServerAuth = false,
  closeoutsApiDbSource = false,
  readDailyCloseouts = () => [],
  loadOperationalEntriesFromApi = async () => [],
  setOperationalEntries = () => {},
  setLastCloseoutDates = () => {},
  setAcknowledgedDuplicateSales = () => {},
  setOwnerPage = () => {},
  setEmployeePage = () => {},
  setSaved = () => {},
  setReturnCloseoutTarget = () => {},
  setOwnerReviewCloseout = () => {},
  pushCloseoutAlert = () => {},
  saveOwner = async () => {},
  persistEmployeeEntry = async () => {},
  savingRef,
  setSaving = () => {},
}) {
  const handleOpenOwnerOperation = useCallback((entry) => {
    const action = resolveOwnerOperationOpenAction(entry, {
      bindsToServerAuth,
      closeoutsApiDbSource,
      readDailyCloseouts,
    });
    if (action.kind === "closeout" && action.closeout) {
      setReturnCloseoutTarget(null);
      setOwnerReviewCloseout(action.closeout);
      return;
    }
    setSelected(action.entry);
  }, [
    bindsToServerAuth,
    closeoutsApiDbSource,
    readDailyCloseouts,
    setOwnerReviewCloseout,
    setReturnCloseoutTarget,
    setSelected,
  ]);

  const requestVoidOperation = useCallback((entryId) => {
    const target = resolveVoidOperationTarget(
      operationalEntries,
      entryId,
      archivedBusinessIds,
      entryIsVoided,
    );
    if (target) setVoidTarget(target);
  }, [archivedBusinessIds, entryIsVoided, operationalEntries, setVoidTarget]);

  const requestRestoreOperation = useCallback((entryId) => {
    const target = resolveRestoreOperationTarget(
      operationalEntries,
      entryId,
      archivedBusinessIds,
      entryIsVoided,
    );
    if (target) setRestoreTarget(target);
  }, [archivedBusinessIds, entryIsVoided, operationalEntries, setRestoreTarget]);

  const confirmReview = useCallback(async (entryId) => {
    if (entriesApiEnabled) {
      const target = operationalEntries.find((entry) => entry.id === entryId);
      if (!target) return;
      try {
        const reviewed = await reviewStoreEntryViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
          entry: target,
        });
        if (!reviewed) {
          window.alert(resolveOperationalEntryReviewFailureMessage(lang));
          return;
        }
        await loadOperationalEntriesFromApi();
        setSelected(null);
      } catch (error) {
        console.warn("entry review api failed", error);
        window.alert(resolveOperationalEntryReviewFailureMessage(lang));
      }
      return;
    }
    const actionAt = new Date().toISOString();
    setOperationalEntries((current) => mapOperationalEntryMutation(
      current,
      entryId,
      (entry) => (entryIsActive(entry) ? applyReviewToEntry(entry, currentOwnerActor, actionAt) : entry),
    ));
    setSelected(null);
  }, [
    closeoutsApiOrganizationId,
    currentOwnerActor,
    entriesApiEnabled,
    entryIsActive,
    lang,
    loadOperationalEntriesFromApi,
    operationalEntries,
    ownerApiUserId,
    setOperationalEntries,
    setSelected,
  ]);

  const confirmVoidOperation = useCallback(async (reason = "") => {
    if (entriesApiEnabled) {
      const target = voidTarget;
      if (!canVoidOperationalEntry(target, archivedBusinessIds, entryIsVoided)) {
        setVoidTarget(null);
        return;
      }
      try {
        const voided = await voidStoreEntryViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
          entry: target,
          reason: reason.trim(),
        });
        if (!voided) {
          window.alert(resolveOperationalEntryVoidFailureMessage(lang));
          return;
        }
        const refreshed = await loadOperationalEntriesFromApi();
        if (target.type === "summary") {
          setLastCloseoutDates((current) => mergeLastCloseoutDateAfterSummaryVoid(
            current,
            target.businessId,
            refreshed,
            entryIsActive,
          ));
        }
        setVoidTarget(null);
        setSelected(null);
      } catch (error) {
        console.warn("entry void api failed", error);
        window.alert(resolveOperationalEntryVoidFailureMessage(lang));
      }
      return;
    }
    const target = voidTarget;
    if (!canVoidOperationalEntry(target, archivedBusinessIds, entryIsVoided)) {
      setVoidTarget(null);
      return;
    }
    const actionAt = new Date().toISOString();
    const nextEntries = mapOperationalEntryMutation(
      operationalEntries,
      target.id,
      (entry) => applyVoidToEntry(entry, currentOwnerActor, reason, actionAt),
    );
    setOperationalEntries(nextEntries);
    if (target.type === "summary") {
      setLastCloseoutDates((current) => mergeLastCloseoutDateAfterSummaryVoid(
        current,
        target.businessId,
        nextEntries,
        entryIsActive,
      ));
    }
    setVoidTarget(null);
    setSelected(null);
  }, [
    archivedBusinessIds,
    closeoutsApiOrganizationId,
    currentOwnerActor,
    entriesApiEnabled,
    entryIsActive,
    entryIsVoided,
    lang,
    loadOperationalEntriesFromApi,
    operationalEntries,
    ownerApiUserId,
    setLastCloseoutDates,
    setOperationalEntries,
    setSelected,
    setVoidTarget,
    voidTarget,
  ]);

  const confirmRestoreOperation = useCallback(async (reason = "") => {
    if (entriesApiEnabled) {
      const target = restoreTarget;
      if (!canRestoreOperationalEntry(target, archivedBusinessIds, entryIsVoided)) {
        setRestoreTarget(null);
        return;
      }
      try {
        const restored = await restoreStoreEntryViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
          entry: target,
          reason: reason.trim(),
        });
        if (!restored) {
          window.alert(resolveOperationalEntryRestoreFailureMessage(lang));
          return;
        }
        const refreshed = await loadOperationalEntriesFromApi();
        if (target.type === "summary") {
          setLastCloseoutDates((current) => mergeLastCloseoutDateAfterSummaryRestore(
            current,
            target.businessId,
            refreshed,
            target.date,
            entryIsActive,
          ));
        }
        setRestoreTarget(null);
        setSelected(null);
      } catch (error) {
        console.warn("entry restore api failed", error);
        window.alert(resolveOperationalEntryRestoreFailureMessage(lang));
      }
      return;
    }
    const target = restoreTarget;
    if (!canRestoreOperationalEntry(target, archivedBusinessIds, entryIsVoided)) {
      setRestoreTarget(null);
      return;
    }
    const actionAt = new Date().toISOString();
    const nextEntries = mapOperationalEntryMutation(
      operationalEntries,
      target.id,
      (entry) => applyRestoreToEntry(entry, currentOwnerActor, reason, actionAt),
    );
    setOperationalEntries(nextEntries);
    if (target.type === "summary") {
      setLastCloseoutDates((current) => mergeLastCloseoutDateAfterSummaryRestore(
        current,
        target.businessId,
        nextEntries,
        target.date,
        entryIsActive,
      ));
    }
    setRestoreTarget(null);
    setSelected(null);
  }, [
    archivedBusinessIds,
    closeoutsApiOrganizationId,
    currentOwnerActor,
    entriesApiEnabled,
    entryIsActive,
    entryIsVoided,
    lang,
    loadOperationalEntriesFromApi,
    operationalEntries,
    ownerApiUserId,
    restoreTarget,
    setLastCloseoutDates,
    setOperationalEntries,
    setRestoreTarget,
    setSelected,
  ]);

  const confirmDuplicateSummary = useCallback(async () => {
    const pending = pendingDuplicateSummary;
    if (!pending?.payload) return;
    setPendingDuplicateSummary(null);
    if (entriesApiDbSource) {
      window.alert(duplicateSummaryBlockedInDbSourceMessage(lang));
      return;
    }
    if (phase9ApiEnabled && entriesApiEnabled) {
      const payload = pending.payload;
      const actorUserId = pending.actor === "owner" ? ownerApiUserId : activeEmployee?.id;
      const actorRole = pending.actor === "owner" ? "owner" : "employee";
      if (!actorUserId || !payload?.businessId) return;
      savingRef.current = true;
      setSaving(true);
      try {
        const apiPayload = await resolvePayloadAttachmentForPhase9Api({
          enabled: phase9ApiEnabled,
          organizationId: closeoutsApiOrganizationId,
          actorUserId,
          actorRole,
          storeId: payload.businessId,
          payload,
        });
        const created = await approveDuplicateSummaryViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId,
          actorRole,
          storeId: payload.businessId,
          date: payload.date,
          payload: apiPayload,
        });
        if (!created) {
          window.alert(resolveDuplicateSummaryApproveFailureMessage(lang));
          return;
        }
        const refreshed = await loadOperationalEntriesFromApi();
        if (payload.type === "summary") {
          const latestActiveCloseoutDate = resolveLatestActiveCloseoutDateFromEntries(
            refreshed,
            payload.businessId,
            payload.date,
            entryIsActive,
          );
          setLastCloseoutDates((current) => ({
            ...current,
            [payload.businessId]: latestActiveCloseoutDate,
          }));
        }
        if (pending.actor === "owner") {
          setOwnerPage("home");
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2200);
        } else {
          const actor = {
            role: "employee",
            userId: activeEmployee.id,
            nameAr: activeEmployee.nameAr,
            nameEn: activeEmployee.nameEn,
          };
          const createdEntry = refreshed.find((entry) => entry.id === created.id);
          if (createdEntry) pushCloseoutAlert(payload, createdEntry, actor);
          setEmployeePage("home");
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2200);
        }
      } catch (error) {
        console.warn("duplicate summary approve api failed", error);
        window.alert(lang === "ar"
          ? "تعذر حفظ الملخص المكرر على الخادم."
          : "Failed to save duplicate summary on server.");
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
      return;
    }
    if (pending.actor === "owner") await saveOwner(pending.payload);
    else await persistEmployeeEntry(pending.payload);
  }, [
    activeEmployee,
    closeoutsApiOrganizationId,
    entriesApiDbSource,
    entriesApiEnabled,
    entryIsActive,
    lang,
    loadOperationalEntriesFromApi,
    ownerApiUserId,
    pendingDuplicateSummary,
    persistEmployeeEntry,
    phase9ApiEnabled,
    pushCloseoutAlert,
    saveOwner,
    savingRef,
    setEmployeePage,
    setLastCloseoutDates,
    setOwnerPage,
    setPendingDuplicateSummary,
    setSaved,
    setSaving,
  ]);

  const acknowledgeDuplicateSales = useCallback(async (alert) => {
    if (!alert?.businessId || !alert?.date || !alert.entries?.length) return;
    if (phase9ApiEnabled && entriesApiEnabled) {
      try {
        const acknowledged = await acknowledgeDuplicateSummariesViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
          storeId: alert.businessId,
          date: alert.date,
          entryIds: alert.entries.map((entry) => entry.id),
        });
        if (!acknowledged) {
          window.alert(resolveDuplicateSummaryAcknowledgeFailureMessage(lang));
          return;
        }
        setAcknowledgedDuplicateSales((current) => ({
          ...current,
          [duplicateSalesGroupKey(alert)]: duplicateSalesSignature(alert.entries),
        }));
      } catch (error) {
        console.warn("duplicate summary acknowledge api failed", error);
        window.alert(resolveDuplicateSummaryAcknowledgeFailureMessage(lang));
      }
      return;
    }
    const actionAt = new Date().toISOString();
    const approvedIds = new Set(alert.entries.map((entry) => entry.id));
    setOperationalEntries((current) => applyDuplicateApprovedAudit(
      current,
      approvedIds,
      currentOwnerActor,
      actionAt,
    ));
    setAcknowledgedDuplicateSales((current) => ({
      ...current,
      [duplicateSalesGroupKey(alert)]: duplicateSalesSignature(alert.entries),
    }));
  }, [
    closeoutsApiOrganizationId,
    currentOwnerActor,
    entriesApiEnabled,
    lang,
    ownerApiUserId,
    phase9ApiEnabled,
    setAcknowledgedDuplicateSales,
    setOperationalEntries,
  ]);

  return {
    handleOpenOwnerOperation,
    requestVoidOperation,
    requestRestoreOperation,
    confirmReview,
    confirmVoidOperation,
    confirmRestoreOperation,
    confirmDuplicateSummary,
    acknowledgeDuplicateSales,
  };
}
