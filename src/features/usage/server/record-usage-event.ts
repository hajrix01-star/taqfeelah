import { z } from "zod";
import { isUsageTrackingEnabled } from "@/core/config/saas-admin-api-mode";
import { getDb } from "@/core/db/client";
import { usageEvents } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid().nullable().optional(),
  userId: z.string().uuid().nullable().optional(),
  eventName: z.string().trim().min(1).max(120),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function recordUsageEvent(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid usage event input.", parsed.error.flatten());
  }
  const input = parsed.data;

  if (!isUsageTrackingEnabled()) {
    return { recorded: false, reason: "usage_tracking_disabled" as const };
  }

  const db = getDb();
  await db.insert(usageEvents).values({
    organizationId: input.organizationId,
    storeId: input.storeId || null,
    userId: input.userId || null,
    eventName: input.eventName,
    eventDate: input.eventDate,
    eventAt: new Date(),
    metadata: input.metadata || null,
  });

  return { recorded: true };
}
