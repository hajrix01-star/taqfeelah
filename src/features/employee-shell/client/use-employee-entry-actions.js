"use client";

import { useCallback } from "react";
import {
  buildCloseoutAlertRecord,
  findDuplicateSummaryEntries,
  isFutureOperationalEntryDate,
  mergeLastCloseoutDateForStore,
  upsertCloseoutAlert,
} from "@/features/operations/operational-entry-save-helpers";
import {
  buildEmployeeEntryActor,
  buildPendingDuplicateSummaryState,
  canPersistOperationalEntry,
  persistOperationalEntryLocally,
  persistOperationalEntryThroughApi,
  resolveSummaryLastCloseoutUpdate,
  shouldGateSummarySaveOnDuplicates,
} from "@/features/operations/operational-entry-persist-helpers";
import { resolveStandaloneEntryBlockedMessage } from "@/features/operations/client/closeout-required-entry-message";

export function useEmployeeEntryActions({
  lang,
  text,
  savingRef,
  setSaving,
  activeEmployee,
  assignedEmployeeBusinessIds,
  entriesApiEnabled,
  entriesApiDbSource = false,
  createOperationalEntryInApi,
  loadOperationalEntriesFromApi,
  buildEntry,
  storeAttachmentPayload,
  setOperationalEntries,
  setLastCloseoutDates,
  setCloseoutAlerts,
  closeoutAlertEnabledForBusiness,
  setEmployeePage,
  setSaved,
  setPendingDuplicateSummary,
  operationalEntries,
  entryIsActive,
  todayDate,
}) {
  const persistEmployeeEntry = useCallback(async (payload) => {
    if (!canPersistOperationalEntry({
      saving: savingRef.current,
      payload,
      allowedBusinessIds: assignedEmployeeBusinessIds,
    }) || !activeEmployee) return;
    if (isFutureOperationalEntryDate(payload.date, todayDate)) {
      window.alert(text(lang, "futureDateNotAllowed"));
      return;
    }
    const blockedMessage = resolveStandaloneEntryBlockedMessage(entriesApiDbSource, lang);
    if (blockedMessage) {
      window.alert(blockedMessage);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const actor = buildEmployeeEntryActor(activeEmployee);
      if (entriesApiEnabled) {
        const result = await persistOperationalEntryThroughApi({
          createOperationalEntryInApi,
          loadOperationalEntriesFromApi,
          payload,
          actorUserId: activeEmployee.id,
          actorRole: "employee",
          lang,
          entriesApiDbSource,
        });
        if (!result.ok) {
          window.alert(result.failureMessage);
          return;
        }
        if (payload.type === "summary") {
          const summaryUpdate = resolveSummaryLastCloseoutUpdate(
            payload,
            result.refreshed,
            result.created.id,
            entryIsActive,
          );
          setLastCloseoutDates((current) => ({
            ...current,
            [summaryUpdate.businessId]: summaryUpdate.date,
          }));
          if (summaryUpdate.createdEntry) {
            if (closeoutAlertEnabledForBusiness(payload.businessId)) {
              setCloseoutAlerts((current) => upsertCloseoutAlert(
                current,
                buildCloseoutAlertRecord(payload, summaryUpdate.createdEntry, actor),
              ));
            }
          }
        }
        setEmployeePage("home");
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2200);
        return;
      }
      const local = await persistOperationalEntryLocally({
        payload,
        actor,
        buildEntry,
        storeAttachmentPayload,
      });
      if (!local.ok) {
        if (local.attachmentFailed) window.alert(text(lang, "attachmentSaveFailed"));
        return;
      }
      setOperationalEntries((current) => [local.entry, ...current]);
      if (payload.type === "summary") {
        setLastCloseoutDates((current) => mergeLastCloseoutDateForStore(
          current,
          payload.businessId,
          payload.date,
        ));
        if (closeoutAlertEnabledForBusiness(payload.businessId)) {
          setCloseoutAlerts((current) => upsertCloseoutAlert(
            current,
            buildCloseoutAlertRecord(payload, local.entry, actor),
          ));
        }
      }
      setEmployeePage("home");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [
    activeEmployee,
    assignedEmployeeBusinessIds,
    buildEntry,
    closeoutAlertEnabledForBusiness,
    createOperationalEntryInApi,
    entriesApiEnabled,
    entriesApiDbSource,
    entryIsActive,
    lang,
    loadOperationalEntriesFromApi,
    savingRef,
    setCloseoutAlerts,
    setEmployeePage,
    setLastCloseoutDates,
    setOperationalEntries,
    setSaved,
    setSaving,
    storeAttachmentPayload,
    text,
    todayDate,
  ]);

  const saveEmployee = useCallback(async (payload) => {
    if (!canPersistOperationalEntry({
      saving: savingRef.current,
      payload,
      allowedBusinessIds: assignedEmployeeBusinessIds,
    }) || !activeEmployee) return;
    if (shouldGateSummarySaveOnDuplicates(payload)) {
      const previousEntries = findDuplicateSummaryEntries(operationalEntries, payload, entryIsActive);
      if (previousEntries.length > 0) {
        setPendingDuplicateSummary(buildPendingDuplicateSummaryState(payload, previousEntries));
        return;
      }
    }
    await persistEmployeeEntry(payload);
  }, [
    activeEmployee,
    assignedEmployeeBusinessIds,
    entryIsActive,
    operationalEntries,
    persistEmployeeEntry,
    savingRef,
    setPendingDuplicateSummary,
  ]);

  return {
    persistEmployeeEntry,
    saveEmployee,
  };
}
