"use client";

import { useEffect } from "react";
import { useOperationalSync } from "@/features/operations/client/use-operational-sync";

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
}) {
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
    notifyLocalWriteRef.current = notifyLocalWrite;
    return () => {
      notifyLocalWriteRef.current = null;
    };
  }, [notifyLocalWrite, notifyLocalWriteRef]);

  return null;
}
