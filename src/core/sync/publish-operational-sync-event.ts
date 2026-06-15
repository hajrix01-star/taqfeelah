import {
  createOperationalSyncEvent,
  type OperationalSyncEvent,
  type OperationalSyncEventType,
} from "@/core/sync/operational-sync-event-types";
import { publishOperationalSyncEvent } from "@/core/sync/operational-sync-bus";

type PublishOperationalSyncEventInput = {
  type: OperationalSyncEventType;
  organizationId: string;
  storeId: string;
  actorUserId: string;
  actorRole: "owner" | "manager" | "employee";
  payload?: Record<string, unknown>;
};

export function publishOperationalSyncEventSafe(input: PublishOperationalSyncEventInput): OperationalSyncEvent | null {
  try {
    const event = createOperationalSyncEvent(input);
    publishOperationalSyncEvent(event);
    return event;
  } catch (error) {
    console.warn("operational sync publish failed", error);
    return null;
  }
}
