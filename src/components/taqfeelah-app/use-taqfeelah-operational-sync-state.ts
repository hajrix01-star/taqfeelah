"use client";

import { useCallback, useRef } from "react";
import type { NotifyOperationalSyncWriteFn } from "@/features/operations/client/operations-client-types";
import type { OperationalSyncEventType } from "@/core/sync/operational-sync-event-types";

export function useTaqfeelahOperationalSyncState() {
  const notifyRef = useRef<NotifyOperationalSyncWriteFn | null>(null);
  const notifyOperationalSyncWrite = useCallback((eventType: OperationalSyncEventType | string) => {
    notifyRef.current?.(eventType);
  }, []);

  return {
    notifyRef,
    notifyOperationalSyncWrite,
  };
}
