import { z } from "zod";

export const OPERATIONAL_SYNC_EVENT_TYPES = [
  "closeout.submitted",
  "closeout.deleted",
  "entry.created",
  "entry.voided",
  "entry.restored",
] as const;

export type OperationalSyncEventType = (typeof OPERATIONAL_SYNC_EVENT_TYPES)[number];

/** Client-only refresh trigger (polling / focus) — never emitted by server SSE. */
export const OPERATIONAL_SYNC_BACKGROUND_REFRESH = "sync.background" as const;

export type OperationalSyncRefreshTrigger =
  | OperationalSyncEventType
  | typeof OPERATIONAL_SYNC_BACKGROUND_REFRESH;

export const operationalSyncEventSchema = z.object({
  type: z.enum(OPERATIONAL_SYNC_EVENT_TYPES),
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  occurredAt: z.string().datetime(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type OperationalSyncEvent = z.infer<typeof operationalSyncEventSchema>;

export function createOperationalSyncEvent(
  input: Omit<OperationalSyncEvent, "occurredAt"> & { occurredAt?: string },
): OperationalSyncEvent {
  return operationalSyncEventSchema.parse({
    ...input,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  });
}
