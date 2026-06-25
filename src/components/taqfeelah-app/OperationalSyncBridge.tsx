"use client";

import { useEffect } from "react";
import { useOperationalSync } from "@/features/operations/client/use-operational-sync";
import type { NotifyOperationalSyncWriteFn } from "@/features/operations/client/operations-client-types";
import type { OperationalSyncBridgeProps } from "./taqfeelah-app-types";

export function OperationalSyncBridge({
  enabled,
  organizationId,
  actorUserId,
  actorRole,
  employee,
  ownerPage,
  employeePage,
  ownerEntryActive,
  employeeEntryActive,
  reloadOperationalEntries,
  closeoutsSyncEnabled,
  entriesSyncEnabled,
  notifyLocalWriteRef,
}: OperationalSyncBridgeProps) {
  const { notifyLocalWrite } = useOperationalSync({
    enabled,
    organizationId,
    actorUserId,
    actorRole,
    employee,
    ownerPage,
    employeePage,
    ownerEntryActive,
    employeeEntryActive,
    reloadOperationalEntries,
    closeoutsSyncEnabled,
    entriesSyncEnabled,
  });

  useEffect(() => {
    if (!notifyLocalWriteRef) return undefined;
    notifyLocalWriteRef.current = notifyLocalWrite as NotifyOperationalSyncWriteFn;
    return () => {
      notifyLocalWriteRef.current = null;
    };
  }, [notifyLocalWrite, notifyLocalWriteRef]);

  return null;
}
