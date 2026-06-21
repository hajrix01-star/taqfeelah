"use client";

import { useEffect, useMemo } from "react";
import { getStoreOperationalConfig } from "@/features/org-config/client/store-operational-config";
import { resolveEmployeeCloseoutsFetchWindow } from "@/features/employee-closeouts/employee-closeout-history";
import { resolveOwnerCloseoutsFetchWindow } from "@/features/closeouts/client/owner-closeouts-fetch-window";
import type {
  PrototypeCloseoutRecord,
  PrototypeOwnerPage,
  PrototypeStoreOperationalSettings,
} from "./prototype-runtime-types";

type UsePrototypeRuntimeRuntimeApiBundleProps = {
  closeoutsApiDbSource: boolean;
  closeoutsApiEnabled: boolean;
  entriesApiDbSource: boolean;
  entriesApiEnabled: boolean;
  runtimeApiStoresReady: boolean;
  apiTargetStoreIdsKey: string;
  employee: boolean;
  storeOperationalSettings: PrototypeStoreOperationalSettings;
  ownerPage: PrototypeOwnerPage;
  ownerManageCloseout: PrototypeCloseoutRecord | null;
  closeoutsApiOrganizationId: string;
  apiActorUserId: string;
  apiActorRole: string;
  ownerApiUserId: string;
  employeePreferencesSyncError?: string | null;
  runtimeSettingsSyncError?: string | null;
  orgConfigSyncError?: string | null;
};

export function usePrototypeRuntimeRuntimeApiBundle({
  closeoutsApiDbSource,
  closeoutsApiEnabled,
  entriesApiDbSource,
  entriesApiEnabled,
  runtimeApiStoresReady,
  apiTargetStoreIdsKey,
  employee,
  storeOperationalSettings,
  ownerPage,
  ownerManageCloseout,
  closeoutsApiOrganizationId,
  apiActorUserId,
  apiActorRole,
  ownerApiUserId,
  employeePreferencesSyncError,
  runtimeSettingsSyncError,
  orgConfigSyncError,
}: UsePrototypeRuntimeRuntimeApiBundleProps) {
  const closeoutsAutoLoadQueryKey = useMemo(() => {
    if (!runtimeApiStoresReady || !apiTargetStoreIdsKey) return "";
    const storeIds = apiTargetStoreIdsKey.split("|").filter(Boolean);
    if (employee) {
      const windowParts = storeIds.map((storeId) => {
        const visibility = getStoreOperationalConfig(storeOperationalSettings, storeId).employeeHistoryVisibility;
        const window = resolveEmployeeCloseoutsFetchWindow(visibility);
        return `${storeId}:${window.dateFrom}-${window.dateTo}`;
      });
      return `employee|${apiTargetStoreIdsKey}|${windowParts.join(",")}`;
    }
    const ownerNeedsCloseouts = ownerPage === "home"
      || ownerPage === "register"
      || ownerPage === "closeouts"
      || ownerPage === "notebook"
      || Boolean(ownerManageCloseout);
    if (!ownerNeedsCloseouts) return "";
    const ownerWindow = resolveOwnerCloseoutsFetchWindow();
    return `owner|${apiTargetStoreIdsKey}|${ownerPage}|${ownerManageCloseout?.id || ""}|${ownerWindow.dateFrom}-${ownerWindow.dateTo}`;
  }, [
    apiTargetStoreIdsKey,
    employee,
    ownerManageCloseout,
    ownerPage,
    runtimeApiStoresReady,
    storeOperationalSettings,
  ]);

  const closeoutAttachmentsApiEnabled = closeoutsApiDbSource && closeoutsApiEnabled;
  const closeoutAttachmentsApiProps = {
    attachmentsApiEnabled: closeoutAttachmentsApiEnabled,
    attachmentsApiOrganizationId: closeoutsApiOrganizationId,
    attachmentsApiActorUserId: apiActorUserId,
    attachmentsApiActorRole: apiActorRole,
  };
  const ownerCloseoutAttachmentsApiProps = {
    attachmentsApiEnabled: closeoutAttachmentsApiEnabled,
    attachmentsApiOrganizationId: closeoutsApiOrganizationId,
    attachmentsApiActorUserId: ownerApiUserId,
    attachmentsApiActorRole: "owner",
  };
  const entryAttachmentsApiEnabled = entriesApiDbSource && entriesApiEnabled;
  const entryAttachmentsApiProps = {
    entryAttachmentsApiEnabled,
    entryAttachmentsApiOrganizationId: closeoutsApiOrganizationId,
    entryAttachmentsApiActorUserId: ownerApiUserId,
    entryAttachmentsApiActorRole: "owner",
  };

  useEffect(() => {
    if (!employeePreferencesSyncError) return;
    console.warn(employeePreferencesSyncError);
  }, [employeePreferencesSyncError]);

  useEffect(() => {
    if (!runtimeSettingsSyncError) return;
    console.warn(runtimeSettingsSyncError);
  }, [runtimeSettingsSyncError]);

  useEffect(() => {
    if (!orgConfigSyncError) return;
    console.warn(orgConfigSyncError);
  }, [orgConfigSyncError]);

  return {
    closeoutsAutoLoadQueryKey,
    closeoutAttachmentsApiProps,
    ownerCloseoutAttachmentsApiProps,
    entryAttachmentsApiProps,
  };
}
