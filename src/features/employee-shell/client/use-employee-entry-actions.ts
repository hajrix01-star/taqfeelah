"use client";

import { useCallback } from "react";
import {
  buildCloseoutAlertRecord,
  isFutureOperationalEntryDate,
  mergeLastCloseoutDateForStore,
  resolveOperationalEntriesRefreshWarningMessage,
  upsertCloseoutAlert,
} from "@/features/operations/operational-entry-save-helpers";
import {
  buildEmployeeEntryActor,
  canPersistOperationalEntry,
  persistOperationalEntryLocally,
  persistOperationalEntryThroughApi,
  resolveSummaryLastCloseoutUpdate,
} from "@/features/operations/operational-entry-persist-helpers";
import { resolveStandaloneEntryBlockedMessage } from "@/features/operations/client/closeout-required-entry-message";
import { appAlert } from "@/lib/ui/app-dialog/app-dialog-bridge";
import type { OperationalEntry, OperationalEntryPayload } from "@/features/entries/client/entries-client-types";
import type { UseEmployeeEntryActionsProps } from "@/features/employee-shell/client/employee-shell-client-types";

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
  entryIsActive,
  todayDate,
}: UseEmployeeEntryActionsProps) {
  const persistEmployeeEntry = useCallback(async (payload: OperationalEntryPayload) => {
    if (!canPersistOperationalEntry({
      saving: savingRef.current,
      payload,
      allowedBusinessIds: assignedEmployeeBusinessIds,
    }) || !activeEmployee) return;
    if (isFutureOperationalEntryDate(payload.date ?? "", todayDate)) {
      await appAlert({ lang, title: text(lang, "futureDateNotAllowed"), variant: "info" });
      return;
    }
    const blockedMessage = resolveStandaloneEntryBlockedMessage(entriesApiDbSource, lang);
    if (blockedMessage) {
      await appAlert({ lang, title: blockedMessage, variant: "warning" });
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
          actorUserId: activeEmployee.id ?? "",
          actorRole: "employee",
          lang,
          entriesApiDbSource,
        });
        if (!result.ok) {
          await appAlert({ lang, title: result.failureMessage, variant: "danger" });
          return;
        }
        if (result.refreshFailed) {
          await appAlert({ lang, title: resolveOperationalEntriesRefreshWarningMessage(lang), variant: "warning" });
        }
        if (payload.type === "summary") {
          const summaryUpdate = resolveSummaryLastCloseoutUpdate(
            payload,
            result.refreshed,
            result.created?.id ?? "",
            entryIsActive,
          );
          setLastCloseoutDates((current: Record<string, string>) => ({
            ...current,
            [summaryUpdate.businessId]: summaryUpdate.date,
          }));
          if (summaryUpdate.createdEntry) {
            if (closeoutAlertEnabledForBusiness(payload.businessId)) {
              setCloseoutAlerts((current) => upsertCloseoutAlert(
                current,
                buildCloseoutAlertRecord(payload, summaryUpdate.createdEntry!, actor),
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
        if (local.attachmentFailed) await appAlert({ lang, title: text(lang, "attachmentSaveFailed"), variant: "info" });
        return;
      }
      setOperationalEntries((current: OperationalEntry[]) => [local.entry!, ...current]);
      if (payload.type === "summary") {
        setLastCloseoutDates((current: Record<string, string>) => mergeLastCloseoutDateForStore(
          current,
          payload.businessId ?? "",
          payload.date ?? "",
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

  const saveEmployee = useCallback(async (payload: OperationalEntryPayload) => {
    await persistEmployeeEntry(payload);
  }, [persistEmployeeEntry]);

  return {
    persistEmployeeEntry,
    saveEmployee,
  };
}