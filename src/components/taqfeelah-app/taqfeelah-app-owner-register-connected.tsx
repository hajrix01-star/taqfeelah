"use client";

import { useCallback, useMemo } from "react";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import {
  buildRegisterCloseoutDeleteRequest,
  closeoutDeleteRequestToRecord,
  resolveCloseoutRecordForRegisterSummary,
} from "@/features/closeouts/client/register-closeout-summary-service";
import { buildRegisterCloseoutResolveOptions } from "@/features/closeouts/client/register-closeout-resolution";
import { confirmCloseoutDelete, alertCloseoutNotFound } from "@/lib/ui/app-dialog/app-dialog-helpers";
import { appAlert } from "@/lib/ui/app-dialog/app-dialog-bridge";
import { text } from "./taqfeelah-app-reference-data";
import { OwnerRegisterScreen } from "./taqfeelah-app-owner-register-screen";
import type { RegisterCloseoutSummary } from "@/features/entries/client/register-log-display";
import type { DailyCloseoutRecord } from "@/features/daily-closeouts/daily-closeouts-types";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type { OwnerRegisterScreenProps } from "./taqfeelah-app-types";

export function buildOwnerRegisterForwardedApiProps({
  registerEntriesApiEnabled,
  registerEntriesApiOrganizationId,
  registerEntriesApiActorUserId,
  registerEntriesApiActorRole,
}: Pick<OwnerRegisterScreenProps,
  | "registerEntriesApiEnabled"
  | "registerEntriesApiOrganizationId"
  | "registerEntriesApiActorUserId"
  | "registerEntriesApiActorRole"
>) {
  return {
    registerEntriesApiEnabled,
    registerEntriesApiOrganizationId,
    registerEntriesApiActorUserId,
    registerEntriesApiActorRole,
  };
}

export function OwnerRegisterConnected({
  setOwnerEditCloseout = () => {},
  onCloseoutDeleted = async () => {},
  onVoidOperation = () => {},
  onRestoreOperation = () => {},
  lang = "ar" as DisplayLang,
  registerEntriesApiEnabled = false,
  closeoutsApiEnabled = false,
  registerEntriesApiOrganizationId,
  registerEntriesApiActorUserId,
  registerEntriesApiActorRole = "owner",
  ...props
}: OwnerRegisterScreenProps & {
  setOwnerEditCloseout?: (closeout: DailyCloseoutRecord | null) => void;
  onCloseoutDeleted?: (closeout: DailyCloseoutRecord) => void | Promise<void>;
}) {
  const { closeouts, reloadCloseoutsFromApi, deleteCloseout } = useDailyCloseouts();

  const closeoutApiContext = useMemo(() => ({
    enabled: Boolean(
      closeoutsApiEnabled
      && registerEntriesApiOrganizationId
      && registerEntriesApiActorUserId,
    ),
    organizationId: registerEntriesApiOrganizationId,
    actorUserId: registerEntriesApiActorUserId,
    actorRole: registerEntriesApiActorRole,
  }), [
    closeoutsApiEnabled,
    registerEntriesApiActorRole,
    registerEntriesApiActorUserId,
    registerEntriesApiOrganizationId,
  ]);

  const resolveSummaryCloseout = useCallback(async (summary: RegisterCloseoutSummary) => {
    const resolved = await resolveCloseoutRecordForRegisterSummary(summary, buildRegisterCloseoutResolveOptions({
      cachedCloseouts: closeouts as import("@/features/operations/client/operations-client-types").CloseoutRecord[],
      reloadCloseouts: async () => reloadCloseoutsFromApi() as Promise<import("@/features/operations/client/operations-client-types").CloseoutRecord[]>,
      apiContext: closeoutApiContext,
    }));
    return (resolved as DailyCloseoutRecord | null) ?? null;
  }, [closeoutApiContext, closeouts, reloadCloseoutsFromApi]);

  const handleEditCloseout = useCallback(async (summary: RegisterCloseoutSummary) => {
    const closeout = await resolveSummaryCloseout(summary);
    if (!closeout) {
      await alertCloseoutNotFound(lang, text);
      return;
    }
    setOwnerEditCloseout(closeout as DailyCloseoutRecord);
  }, [lang, resolveSummaryCloseout, setOwnerEditCloseout]);

  const handleDeleteCloseout = useCallback(async (summary: RegisterCloseoutSummary) => {
    const deleteRequest = buildRegisterCloseoutDeleteRequest(summary);
    if (!deleteRequest) {
      await alertCloseoutNotFound(lang, text);
      return;
    }
    if (!(await confirmCloseoutDelete(lang, text))) return;
    try {
      const closeout = closeoutDeleteRequestToRecord(deleteRequest);
      await deleteCloseout(String(closeout.id || ""), closeout as DailyCloseoutRecord);
      await onCloseoutDeleted(closeout as DailyCloseoutRecord);
    } catch (error) {
      console.warn("closeout delete failed", error);
      await appAlert({
        lang,
        title: lang === "ar" ? "تعذر حذف التقفيلة." : "Failed to delete closeout.",
        variant: "danger",
      });
    }
  }, [deleteCloseout, lang, onCloseoutDeleted]);

  const registerApiProps = buildOwnerRegisterForwardedApiProps({
    registerEntriesApiEnabled,
    registerEntriesApiOrganizationId,
    registerEntriesApiActorUserId,
    registerEntriesApiActorRole,
  });

  return (
    <OwnerRegisterScreen
      {...props}
      lang={lang}
      {...registerApiProps}
      onVoidOperation={onVoidOperation}
      onRestoreOperation={onRestoreOperation}
      onEditCloseout={handleEditCloseout}
      onDeleteCloseout={handleDeleteCloseout}
    />
  );
}
