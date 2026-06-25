"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { applyOperationalSyncRefresh } from "@/core/client/apply-operational-sync-refresh";
import { connectOperationalSyncStream } from "@/core/client/connect-operational-sync-stream";
import {
  createOperationalSyncBroadcastChannel,
  notifyLocalOperationalSyncWrite,
  postOperationalSyncBroadcast,
  type OperationalSyncBroadcastMessage,
} from "@/core/client/operational-sync-broadcast";
import {
  resolveOperationalSyncRefreshTarget,
  shouldPauseOperationalSyncRefresh,
  shouldEnableOperationalSyncFocusRefetch,
  shouldEnableOperationalSyncPolling,
} from "@/core/client/resolve-operational-sync-target";
import { OPERATIONAL_SYNC_POLL_INTERVAL_MS, OPERATIONAL_SYNC_REFRESH_DEBOUNCE_MS } from "@/core/sync/operational-sync-policy";
import { OPERATIONAL_SYNC_BACKGROUND_REFRESH } from "@/core/sync/operational-sync-event-types";
import type { OperationalSyncEventType, OperationalSyncRefreshTrigger } from "@/core/sync/operational-sync-event-types";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import type { OperationalSyncScheduleOptions, UseOperationalSyncProps } from "./operations-client-types";

export function useOperationalSync({
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
}: UseOperationalSyncProps) {
  const queryClient = useQueryClient();
  const { reloadCloseoutsFromApi } = useDailyCloseouts();
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const refreshInFlightRef = useRef(false);
  const refreshQueuedRef = useRef<OperationalSyncEventType | typeof OPERATIONAL_SYNC_BACKGROUND_REFRESH | "refresh.all" | null>(null);
  const lastRefreshAtRef = useRef(0);

  const syncContext = useMemo(() => ({
    employee,
    ownerPage,
    employeePage,
    ownerEntryActive,
    employeeEntryActive,
    syncEnabled: enabled,
  }), [employee, employeeEntryActive, employeePage, enabled, ownerEntryActive, ownerPage]);

  const pollingEnabled = shouldEnableOperationalSyncPolling(syncContext);
  const focusRefetchEnabled = shouldEnableOperationalSyncFocusRefetch(syncContext);

  const runRefresh = useCallback(async (eventType: OperationalSyncEventType | typeof OPERATIONAL_SYNC_BACKGROUND_REFRESH | "refresh.all") => {
    const target = resolveOperationalSyncRefreshTarget(eventType as OperationalSyncRefreshTrigger);
    await applyOperationalSyncRefresh({
      queryClient,
      invalidateScopes: target.invalidateScopes,
      reloadCloseouts: reloadCloseoutsFromApi,
      reloadEntries: reloadOperationalEntries,
      reloadCloseoutsEnabled: closeoutsSyncEnabled && target.reloadCloseouts,
      reloadEntriesEnabled: entriesSyncEnabled && target.reloadEntries,
    });
  }, [
    closeoutsSyncEnabled,
    entriesSyncEnabled,
    queryClient,
    reloadCloseoutsFromApi,
    reloadOperationalEntries,
  ]);

  const scheduleRefresh = useCallback((
    eventType: OperationalSyncEventType | typeof OPERATIONAL_SYNC_BACKGROUND_REFRESH | "refresh.all",
    options: OperationalSyncScheduleOptions = {},
  ) => {
    if (shouldPauseOperationalSyncRefresh(syncContext)) {
      return;
    }

    const { skipSelfEcho = false, actorUserId: sourceActorUserId = "" } = options;
    if (skipSelfEcho && sourceActorUserId && sourceActorUserId === actorUserId) {
      return;
    }

    const now = Date.now();
    const elapsed = now - lastRefreshAtRef.current;
    const delay = elapsed >= OPERATIONAL_SYNC_REFRESH_DEBOUNCE_MS
      ? 0
      : OPERATIONAL_SYNC_REFRESH_DEBOUNCE_MS - elapsed;

    if (refreshInFlightRef.current) {
      refreshQueuedRef.current = eventType;
      return;
    }

    const execute = async () => {
      refreshInFlightRef.current = true;
      try {
        await runRefresh(eventType);
        lastRefreshAtRef.current = Date.now();
      } catch (error) {
        console.warn("operational sync refresh failed", error);
      } finally {
        refreshInFlightRef.current = false;
        const queued = refreshQueuedRef.current;
        refreshQueuedRef.current = null;
        if (queued) {
          void scheduleRefresh(queued);
        }
      }
    };

    if (delay === 0) {
      void execute();
      return;
    }

    window.setTimeout(() => {
      void execute();
    }, delay);
  }, [actorUserId, runRefresh, syncContext]);

  const notifyLocalWrite = useCallback((eventType: OperationalSyncEventType) => {
    notifyLocalOperationalSyncWrite(broadcastChannelRef.current, eventType, actorUserId);
  }, [actorUserId]);

  useEffect(() => {
    broadcastChannelRef.current = createOperationalSyncBroadcastChannel();
    const channel = broadcastChannelRef.current;
    if (!channel) return undefined;

    const onMessage = (event: MessageEvent<OperationalSyncBroadcastMessage>) => {
      const message = event.data;
      if (!message?.eventType) return;
      if (message.source === "local-write" && message.actorUserId === actorUserId) {
        return;
      }
      scheduleRefresh(message.eventType, {
        skipSelfEcho: true,
        actorUserId: message.actorUserId || "",
      });
    };

    channel.addEventListener("message", onMessage);
    return () => {
      channel.removeEventListener("message", onMessage);
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [actorUserId, scheduleRefresh]);

  useEffect(() => {
    if (!enabled || !organizationId || !actorUserId || !actorRole) return undefined;

    const abortController = new AbortController();
    let reconnectTimer = 0;
    let disposed = false;

    const connect = async () => {
      try {
        await connectOperationalSyncStream({
          organizationId,
          actorUserId,
          actorRole,
          signal: abortController.signal,
          onEvent: (event) => {
            scheduleRefresh(event.type, {
              skipSelfEcho: true,
              actorUserId: event.actorUserId,
            });
            postOperationalSyncBroadcast(broadcastChannelRef.current, {
              source: "remote-event",
              eventType: event.type,
              actorUserId: event.actorUserId,
              sentAt: event.occurredAt,
            });
          },
          onError: (error) => {
            if (abortController.signal.aborted) return;
            console.warn("operational sync stream error", error);
          },
        });
      } catch (error) {
        if (abortController.signal.aborted || disposed) return;
        console.warn("operational sync stream disconnected", error);
      }

      if (abortController.signal.aborted || disposed) return;
      reconnectTimer = window.setTimeout(() => {
        void connect();
      }, OPERATIONAL_SYNC_POLL_INTERVAL_MS);
    };

    void connect();

    return () => {
      disposed = true;
      abortController.abort();
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
    };
  }, [actorRole, actorUserId, enabled, organizationId, scheduleRefresh]);

  useEffect(() => {
    if (!enabled || !focusRefetchEnabled) return undefined;

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      scheduleRefresh(OPERATIONAL_SYNC_BACKGROUND_REFRESH);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, focusRefetchEnabled, scheduleRefresh]);

  useEffect(() => {
    if (!enabled || !pollingEnabled) return undefined;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      scheduleRefresh(OPERATIONAL_SYNC_BACKGROUND_REFRESH);
    }, OPERATIONAL_SYNC_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, pollingEnabled, scheduleRefresh]);

  return {
    notifyLocalWrite,
  };
}
