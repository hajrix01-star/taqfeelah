"use client";

import { useCallback } from "react";
import {
  restoreStoreEntryViaApi,
  voidStoreEntryViaApi,
} from "@/features/entries/client/store-entries-api-client";
import { appAlert } from "@/lib/ui/app-dialog/app-dialog-bridge";
import {
  applyRestoreToEntry,
  applyVoidToEntry,
  canRestoreOperationalEntry,
  canVoidOperationalEntry,
  mapOperationalEntryMutation,
  mergeLastCloseoutDateAfterSummaryRestore,
  mergeLastCloseoutDateAfterSummaryVoid,
  resolveOperationalEntryRestoreFailureMessage,
  resolveOperationalEntryVoidFailureMessage,
} from "@/features/operations/operational-entry-mutation-helpers";

export function useRegisterVoidRestoreHandlers({
  lang,
  voidTarget = null,
  setVoidTarget = () => {},
  restoreTarget = null,
  setRestoreTarget = () => {},
  operationalEntries = [],
  archivedBusinessIds = [],
  entriesApiEnabled = false,
  closeoutsApiOrganizationId = "",
  ownerApiUserId = "",
  currentOwnerActor,
  entryIsActive = () => true,
  entryIsVoided = () => false,
  loadOperationalEntriesFromApi = async () => [],
  setOperationalEntries = () => {},
  setLastCloseoutDates = () => {},
  setSelected = () => {},
}) {
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
          await appAlert({ lang, title: resolveOperationalEntryVoidFailureMessage(lang), variant: "danger" });
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
        await appAlert({ lang, title: resolveOperationalEntryVoidFailureMessage(lang), variant: "danger" });
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
          await appAlert({ lang, title: resolveOperationalEntryRestoreFailureMessage(lang), variant: "danger" });
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
        await appAlert({ lang, title: resolveOperationalEntryRestoreFailureMessage(lang), variant: "danger" });
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

  return {
    confirmVoidOperation,
    confirmRestoreOperation,
  };
}