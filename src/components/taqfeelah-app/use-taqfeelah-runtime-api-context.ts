"use client";

import { useMemo } from "react";
import { isUuid } from "@/core/client/api-id-utils";
import {
  resolveRuntimeApiActorContext,
  type ResolveRuntimeApiActorContextInput,
} from "@/core/config/runtime-capabilities";
import { resolveOwnerSettingsApiAuth } from "@/features/runtime-settings/client/runtime-settings-bridge";

type RuntimeApiContextInput = {
  bindsToServerAuth: boolean;
  orgConfigApiEnabled: boolean;
  employee: boolean;
  loggedIn: boolean;
  employeeRuntimeReady: boolean;
  sessionOrganizationId: ResolveRuntimeApiActorContextInput["sessionOrganizationId"] | null;
  sessionUserId: ResolveRuntimeApiActorContextInput["sessionUserId"] | null;
  activeEmployee: ResolveRuntimeApiActorContextInput["activeEmployee"];
  assignedEmployeeBusinesses: NonNullable<ResolveRuntimeApiActorContextInput["assignedEmployeeBusinesses"]>;
  activeBusinesses: NonNullable<ResolveRuntimeApiActorContextInput["operationalBusinesses"]>;
  ownerOrgConfigReady: boolean;
};

export function useTaqfeelahRuntimeApiContext({
  bindsToServerAuth,
  orgConfigApiEnabled,
  employee,
  loggedIn,
  employeeRuntimeReady,
  sessionOrganizationId,
  sessionUserId,
  activeEmployee,
  assignedEmployeeBusinesses,
  activeBusinesses,
  ownerOrgConfigReady,
}: RuntimeApiContextInput) {
  const {
    closeoutsApiEnabled: resolvedCloseoutsApiEnabled,
    closeoutsApiStrictMode,
    entriesApiEnabled: resolvedEntriesApiEnabled,
    entriesApiStrictMode,
    phase9ApiEnabled,
    organizationId: closeoutsApiOrganizationId,
    ownerApiUserId,
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
  } = resolveRuntimeApiActorContext({
    employee,
    sessionOrganizationId: sessionOrganizationId ?? "",
    sessionUserId: sessionUserId ?? "",
    activeEmployee,
    assignedEmployeeBusinesses,
    operationalBusinesses: activeBusinesses,
  });

  const runtimeApiStoresReady = useMemo(
    () => {
      if (!orgConfigApiEnabled) return true;
      if (employee) {
        return employeeRuntimeReady && Boolean(apiTargetStoreIdsKey);
      }
      return ownerOrgConfigReady && Boolean(apiTargetStoreIdsKey);
    },
    [apiTargetStoreIdsKey, employee, employeeRuntimeReady, orgConfigApiEnabled, ownerOrgConfigReady],
  );

  const runtimeApiAuth = useMemo(
    () => resolveOwnerSettingsApiAuth({
      sessionOrganizationId: sessionOrganizationId ?? undefined,
      sessionUserId: sessionUserId ?? undefined,
      actorRole: employee ? "employee" : "owner",
    }),
    [employee, sessionOrganizationId, sessionUserId],
  );

  const ownerNotebookApiEnabled = useMemo(
    () => bindsToServerAuth && isUuid(closeoutsApiOrganizationId) && isUuid(ownerApiUserId),
    [bindsToServerAuth, closeoutsApiOrganizationId, ownerApiUserId],
  );

  const operationalSyncEnabled = useMemo(
    () => loggedIn
      && runtimeApiStoresReady
      && isUuid(closeoutsApiOrganizationId)
      && (resolvedCloseoutsApiEnabled || resolvedEntriesApiEnabled),
    [
      closeoutsApiOrganizationId,
      loggedIn,
      resolvedCloseoutsApiEnabled,
      resolvedEntriesApiEnabled,
      runtimeApiStoresReady,
    ],
  );

  return {
    closeoutsApiEnabled: resolvedCloseoutsApiEnabled,
    closeoutsApiStrictMode,
    entriesApiEnabled: resolvedEntriesApiEnabled,
    entriesApiStrictMode,
    phase9ApiEnabled,
    closeoutsApiOrganizationId,
    ownerApiUserId,
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
    runtimeApiStoresReady,
    runtimeApiAuth,
    ownerNotebookApiEnabled,
    operationalSyncEnabled,
  };
}
