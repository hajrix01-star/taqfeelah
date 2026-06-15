import { OPERATIONAL_SYNC_BROADCAST_CHANNEL } from "@/core/sync/operational-sync-policy";
import type { OperationalSyncEventType } from "@/core/sync/operational-sync-event-types";

export type OperationalSyncBroadcastMessage = {
  source: "local-write" | "remote-event";
  eventType: OperationalSyncEventType | "refresh.all";
  actorUserId?: string;
  sentAt: string;
};

export function createOperationalSyncBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(OPERATIONAL_SYNC_BROADCAST_CHANNEL);
  } catch {
    return null;
  }
}

export function postOperationalSyncBroadcast(
  channel: BroadcastChannel | null,
  message: OperationalSyncBroadcastMessage,
): void {
  if (!channel) return;
  try {
    channel.postMessage(message);
  } catch (error) {
    console.warn("operational sync broadcast failed", error);
  }
}

export function notifyLocalOperationalSyncWrite(
  channel: BroadcastChannel | null,
  eventType: OperationalSyncEventType,
  actorUserId: string,
): void {
  postOperationalSyncBroadcast(channel, {
    source: "local-write",
    eventType,
    actorUserId,
    sentAt: new Date().toISOString(),
  });
}
