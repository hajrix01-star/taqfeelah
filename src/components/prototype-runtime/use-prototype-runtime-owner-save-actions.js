"use client";

import { storeAttachmentPayload } from "@/features/attachments/client/prototype-attachment-storage";
import {
  isFutureOperationalEntryDate,
  mergeLastCloseoutDateForStore,
  resolveOperationalEntriesRefreshWarningMessage,
} from "@/features/operations/operational-entry-save-helpers";
import {
  canPersistOperationalEntry,
  findCreatedEntryInRefreshedList,
  persistOperationalEntryLocally,
  persistOperationalEntryThroughApi,
  resolveSummaryLastCloseoutUpdate,
} from "@/features/operations/operational-entry-persist-helpers";
import {
  buildOwnerOutflowCloseoutDraft,
  isOwnerStandaloneOutflowPayload,
} from "@/features/operations/client/build-owner-outflow-closeout-draft";
import { buildCloseoutSubmitFailureMessage, diagnoseCloseoutSubmitFailure } from "@/features/closeouts/client/closeouts-api-client";
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
  closeoutsApiEnabled = false,
  closeoutsApiOrganizationId = "",
  ownerCloseoutChannelConfig = { channels: [] },
  syncSubmitCloseoutToApi = async () => null,
}) {
  const saveOwner = async (payload) => {
    if (entriesApiDbSource && isOwnerStandaloneOutflowPayload(payload)) {
      if (!closeoutsApiEnabled) {
        window.alert(lang === "ar"
          ? "مسار API للتقفيلات غير مفعّل."
          : "Closeouts API is disabled.");
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

      const closeout = buildOwnerOutflowCloseoutDraft(payload, lang);
      if (!closeout) return;

      const submitFailure = diagnoseCloseoutSubmitFailure({
        organizationId: closeoutsApiOrganizationId,
        actorUserId: ownerApiUserId,
        closeout,
        storeChannels: ownerCloseoutChannelConfig.channels || [],
      });
      if (submitFailure) {
        window.alert(buildCloseoutSubmitFailureMessage(submitFailure, lang));
        return;
      }

      savingRef.current = true;
      setSaving(true);
      try {
        const result = await syncSubmitCloseoutToApi({
          action: "submit",
          closeout,
          employee: {
            id: ownerApiUserId,
            apiUserId: ownerApiUserId,
            submitActorRole: "owner",
          },
        });
        if (!result) {
          window.alert(lang === "ar"
            ? "تعذر حفظ الخارج على الخادم."
            : "Failed to save outflow on server.");
          return;
        }
        const refreshed = await loadOperationalEntriesFromApi();
        const createdOutflowId = Array.isArray(result.outflowEntryIds) ? result.outflowEntryIds[0] : null;
        setOwnerPage("home");
        setSavedOutflowShareTarget(findCreatedEntryInRefreshedList(refreshed, createdOutflowId));
      } catch (error) {
        const message = error instanceof Error && error.message
          ? error.message
          : (lang === "ar" ? "تعذر حفظ الخارج على الخادم." : "Failed to save outflow on server.");
        window.alert(message);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
      return;
    }

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
    await saveOwner(payload);
  };

  return {
    saveOwner,
    saveOwnerSummary,
  };
}
