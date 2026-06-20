"use client";

import { useCallback } from "react";
import {
  acknowledgeDuplicateSummariesViaApi,
  approveDuplicateSummaryViaApi,
} from "@/features/exports-attachments/client/exports-attachments-api-client";
import { resolveInlineAttachmentPayloadForApi } from "@/features/exports-attachments/client/inline-attachment-api-flow";
import { resolveLatestActiveCloseoutDateFromEntries } from "@/features/operations/operational-entry-save-helpers";
import {
  applyDuplicateApprovedAudit,
  duplicateSalesGroupKey,
  duplicateSalesSignature,
  resolveDuplicateSummaryAcknowledgeFailureMessage,
  resolveDuplicateSummaryApproveFailureMessage,
} from "@/features/operations/operational-entry-mutation-helpers";
import { duplicateSummaryBlockedInDbSourceMessage } from "@/features/operations/client/closeout-required-entry-message";
import { appAlert } from "@/lib/ui/app-dialog/app-dialog-bridge";

export function useRegisterDuplicateSummaryHandlers({
  lang,
  pendingDuplicateSummary = null,
  setPendingDuplicateSummary = () => {},
  entriesApiEnabled = false,
  entriesApiDbSource = false,
  phase9ApiEnabled = false,
  closeoutsApiOrganizationId = "",
  ownerApiUserId = "",
  currentOwnerActor,
  activeEmployee = null,
  entryIsActive = () => true,
  loadOperationalEntriesFromApi = async () => [],
  setOperationalEntries = () => {},
  setLastCloseoutDates = () => {},
  setAcknowledgedDuplicateSales = () => {},
  setOwnerPage = () => {},
  setEmployeePage = () => {},
  setSaved = () => {},
  pushCloseoutAlert = () => {},
  saveOwner = async () => {},
  persistEmployeeEntry = async () => {},
  savingRef,
  setSaving = () => {},
}) {
  const confirmDuplicateSummary = useCallback(async () => {
    const pending = pendingDuplicateSummary;
    if (!pending?.payload) return;
    setPendingDuplicateSummary(null);
    if (entriesApiDbSource) {
      await appAlert({ lang, title: duplicateSummaryBlockedInDbSourceMessage(lang), variant: "warning" });
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
        const apiPayload = await resolveInlineAttachmentPayloadForApi({
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
          await appAlert({ lang, title: resolveDuplicateSummaryApproveFailureMessage(lang), variant: "danger" });
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
        await appAlert({ lang, title: resolveDuplicateSummaryApproveFailureMessage(lang), variant: "danger" });
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
          await appAlert({ lang, title: resolveDuplicateSummaryAcknowledgeFailureMessage(lang), variant: "danger" });
          return;
        }
        setAcknowledgedDuplicateSales((current) => ({
          ...current,
          [duplicateSalesGroupKey(alert)]: duplicateSalesSignature(alert.entries),
        }));
      } catch (error) {
        console.warn("duplicate summary acknowledge api failed", error);
        await appAlert({ lang, title: resolveDuplicateSummaryAcknowledgeFailureMessage(lang), variant: "danger" });
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
    confirmDuplicateSummary,
    acknowledgeDuplicateSales,
  };
}