"use client";

import { storeAttachmentPayload } from "@/features/attachments/client/attachment-payload-storage";
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
import { text } from "./taqfeelah-app-reference-data";
import {
  buildEntry,
} from "./taqfeelah-app-operational-entry-helpers";
import { entryIsActive } from "./taqfeelah-app-entry-helpers";
import { appAlert } from "@/lib/ui/app-dialog/app-dialog-bridge";
import type {
  OperationalEntryPayload,
  UseTaqfeelahAppOwnerSaveActionsProps,
  OperationalEntry,
} from "./taqfeelah-app-types";
import { DEFAULT_STORE_CHANNEL_CONFIG } from "./taqfeelah-app-reference-data";

export function useTaqfeelahAppOwnerSaveActions({
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
  ownerCloseoutChannelConfig = DEFAULT_STORE_CHANNEL_CONFIG,
  syncSubmitCloseoutToApi = async () => null,
}: UseTaqfeelahAppOwnerSaveActionsProps) {
  const saveOwner = async (payload: OperationalEntryPayload) => {
    if (entriesApiDbSource && isOwnerStandaloneOutflowPayload(payload)) {
      if (!closeoutsApiEnabled) {
        await appAlert({ lang, title: text(lang, "closeoutsApiDisabled"), variant: "warning" });
        return;
      }
      if (!canPersistOperationalEntry({
        saving: savingRef.current,
        payload,
        allowedBusinessIds: activeBusinessIds,
      })) return;
      if (isFutureOperationalEntryDate(payload.date || "", todayDate)) {
        await appAlert({ lang, title: text(lang, "futureDateNotAllowed"), variant: "info" });
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
        await appAlert({ lang, title: buildCloseoutSubmitFailureMessage(submitFailure, lang), variant: "danger" });
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
          await appAlert({ lang, title: text(lang, "outflowSaveFailed"), variant: "danger" });
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
        await appAlert({ lang, title: message, variant: "danger" });
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
      return;
    }

    if (entriesApiDbSource) {
      await appAlert({ lang, title: text(lang, "closeoutRequiredForEntry"), variant: "info" });
      return;
    }
    if (!canPersistOperationalEntry({
      saving: savingRef.current,
      payload,
      allowedBusinessIds: activeBusinessIds,
    })) return;
    if (isFutureOperationalEntryDate(payload.date || "", todayDate)) {
      await appAlert({ lang, title: text(lang, "futureDateNotAllowed"), variant: "info" });
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      if (entriesApiEnabled) {
        const result = await persistOperationalEntryThroughApi({
          createOperationalEntryInApi: createOperationalEntryInApi as (args: {
            payload: OperationalEntryPayload;
            actorUserId: string;
            actorRole: string;
          }) => Promise<OperationalEntry | null>,
          loadOperationalEntriesFromApi,
          payload,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
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
            result.created.id || "",
            entryIsActive,
          );
          setLastCloseoutDates((current: Record<string, string>) => ({
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
        if (local.attachmentFailed) await appAlert({ lang, title: text(lang, "attachmentSaveFailed"), variant: "info" });
        return;
      }
      setOperationalEntries((current: OperationalEntry[]) => [local.entry, ...current]);
      if (payload.type === "summary") {
        setLastCloseoutDates((current: Record<string, string>) => mergeLastCloseoutDateForStore(current, payload.businessId || "", payload.date || ""));
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
      await appAlert({ lang, title: message, variant: "danger" });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const saveOwnerSummary = async (payload: OperationalEntryPayload) => {
    await saveOwner(payload);
  };

  return {
    saveOwner,
    saveOwnerSummary,
  };
}
