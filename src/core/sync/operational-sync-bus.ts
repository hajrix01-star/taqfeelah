import type { OperationalSyncEvent } from "@/core/sync/operational-sync-event-types";

export type OperationalSyncSubscriber = (event: OperationalSyncEvent) => void;

type OrganizationChannel = {
  subscribers: Set<OperationalSyncSubscriber>;
};

const organizationChannels = new Map<string, OrganizationChannel>();

function getOrganizationChannel(organizationId: string): OrganizationChannel {
  const existing = organizationChannels.get(organizationId);
  if (existing) return existing;
  const created: OrganizationChannel = { subscribers: new Set() };
  organizationChannels.set(organizationId, created);
  return created;
}

export function subscribeOperationalSyncEvents(
  organizationId: string,
  subscriber: OperationalSyncSubscriber,
): () => void {
  const channel = getOrganizationChannel(organizationId);
  channel.subscribers.add(subscriber);
  return () => {
    channel.subscribers.delete(subscriber);
    if (channel.subscribers.size === 0) {
      organizationChannels.delete(organizationId);
    }
  };
}

export function publishOperationalSyncEvent(event: OperationalSyncEvent): void {
  const channel = organizationChannels.get(event.organizationId);
  if (!channel || channel.subscribers.size === 0) return;
  for (const subscriber of channel.subscribers) {
    try {
      subscriber(event);
    } catch (error) {
      console.warn("operational sync subscriber failed", error);
    }
  }
}

/** Test-only reset helper. */
export function __resetOperationalSyncBusForTests(): void {
  organizationChannels.clear();
}
