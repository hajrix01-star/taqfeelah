import { describe, expect, it, vi } from "vitest";
import {
  __resetOperationalSyncBusForTests,
  publishOperationalSyncEvent,
  subscribeOperationalSyncEvents,
} from "@/core/sync/operational-sync-bus";
import { createOperationalSyncEvent } from "@/core/sync/operational-sync-event-types";

describe("operational sync bus", () => {
  it("delivers events to organization subscribers", () => {
    __resetOperationalSyncBusForTests();
    const listener = vi.fn();
    const unsubscribe = subscribeOperationalSyncEvents("8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1", listener);
    const event = createOperationalSyncEvent({
      type: "closeout.submitted",
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "employee",
    });

    publishOperationalSyncEvent(event);

    expect(listener).toHaveBeenCalledWith(event);
    unsubscribe();
  });

  it("does not deliver events to other organizations", () => {
    __resetOperationalSyncBusForTests();
    const listener = vi.fn();
    subscribeOperationalSyncEvents("8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1", listener);
    publishOperationalSyncEvent(createOperationalSyncEvent({
      type: "entry.created",
      organizationId: "11111111-1111-4111-8111-111111111111",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
    }));

    expect(listener).not.toHaveBeenCalled();
  });
});
