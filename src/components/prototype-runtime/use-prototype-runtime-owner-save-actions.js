"use client";

import { storeAttachmentPayload } from "@/features/attachments/client/prototype-attachment-storage";
import {
  findDuplicateSummaryEntries,
  isFutureOperationalEntryDate,
  mergeLastCloseoutDateForStore,
  resolveOperationalEntriesRefreshWarningMessage,
} from "@/features/operations/operational-entry-save-helpers";
import {
  buildPendingDuplicateSummaryState,
  canPersistOperationalEntry,
  findCreatedEntryInRefreshedList,
  persistOperationalEntryLocally,
  persistOperationalEntryThroughApi,
  resolveSummaryLastCloseoutUpdate,
  shouldGateSummarySaveOnDuplicates,
} from "@/features/operations/operational-entry-persist-helpers";
import { text } from "./prototype-runtime-demo-data";
import {
  buildEntry,
} from "./prototype-runtime-demo-operational-entries";
import { entryIsActive } from "./prototype-runtime-entry-helpers";

export function usePrototypeRuntimeOwnerSaveActions({
  lang,
  savingRef,
  setSaving,
  entriesApiDbSource,
  entriesApiEnabled,
  activeBusinessIds,
  todayDate,
  createOperationalEntryInApi,
  loadOperationalEntriesFromApi,
  ownerApiUserId,
  currentOwnerActor,
  setLastCloseoutDates,
  setOwnerPage,
  setSavedOutflowShareTarget,
  setSaved,
  setOperationalEntries,
  operationalEntries,
  setPendingDuplicateSummary,
}) {
  const saveOwner = async (payload) => {
    if (entriesApiDbSource) {
      window.alert(text(lang, "closeoutRequiredForEntry"));
      return;
    }
    if (!canPersistOperationalEntry({
      saving: savingRef.current,
      payload,
      allowedBusinessIds: activeBusinessIds,
    })) return;
    if (isFutureOperationalEntryDate(payload.date, todayDate)) {
      window.alert(text(lang, "futureDateNotAllowed"));
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      if (entriesApiEnabled) {
        const result = await persistOperationalEntryThroughApi({
          createOperationalEntryInApi,
          loadOperationalEntriesFromApi,
          payload,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
          lang,
          entriesApiDbSource,
        });
        if (!result.ok) {
          window.alert(result.failureMessage);
          return;
        }
        if (result.refreshFailed) {
          window.alert(resolveOperationalEntriesRefreshWarningMessage(lang));
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
        }
        setOwnerPage("home");
        if (payload.type !== "summary") {
          setSavedOutflowShareTarget(findCreatedEntryInRefreshedList(result.refreshed, result.created.id));
        } else {
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2200);
        }
        return;
      }
      const local = await persistOperationalEntryLocally({
        payload,
        actor: currentOwnerActor,
        buildEntry,
        storeAttachmentPayload,
      });
      if (!local.ok) {
        if (local.attachmentFailed) window.alert(text(lang, "attachmentSaveFailed"));
        return;
      }
      setOperationalEntries((current) => [local.entry, ...current]);
      if (payload.type === "summary") {
        setLastCloseoutDates((current) => mergeLastCloseoutDateForStore(current, payload.businessId, payload.date));
      }
      setOwnerPage("home");
      if (payload.type !== "summary") setSavedOutflowShareTarget(local.entry);
      else {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2200);
      }
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : (lang === "ar" ? "تعذر حفظ العملية على الخادم." : "Failed to save entry on server.");
      window.alert(message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const saveOwnerSummary = async (payload) => {
    if (entriesApiDbSource) {
      window.alert(text(lang, "closeoutRequiredForEntry"));
      return;
    }
    if (savingRef.current || !payload?.businessId) return;
    if (shouldGateSummarySaveOnDuplicates(payload)) {
      const previousEntries = findDuplicateSummaryEntries(operationalEntries, payload, entryIsActive);
      if (previousEntries.length > 0) {
        setPendingDuplicateSummary(buildPendingDuplicateSummaryState(payload, previousEntries, "owner"));
        return;
      }
    }
    await saveOwner(payload);
  };

  return {
    saveOwner,
    saveOwnerSummary,
  };
}
