import { max, sql, sum } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import {
  attachments,
  auditEvents,
  dailyCloseouts,
  organizations,
  usageEvents,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import type { SystemHealthReport } from "@/features/saas-admin/types";
import { getReleaseMeta } from "@/release/version";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
});

export async function getSystemHealth(
  rawInput: z.infer<typeof inputSchema>,
): Promise<SystemHealthReport> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid system health input.", parsed.error.flatten());
  }
  const db = getDb();

  let databaseStatus: SystemHealthReport["database"]["status"] = "healthy";
  let databaseMessage = "قاعدة البيانات متصلة وتستجيب.";
  try {
    await db.select({ one: sql<number>`1` }).from(organizations).limit(1);
  } catch {
    databaseStatus = "unhealthy";
    databaseMessage = "فشل الاتصال بقاعدة البيانات.";
  }

  const [lastCloseout] = await db
    .select({ at: max(dailyCloseouts.createdAt) })
    .from(dailyCloseouts);

  const [lastAttachment] = await db
    .select({ at: max(attachments.createdAt) })
    .from(attachments);

  const [lastUsage] = await db
    .select({ at: max(usageEvents.eventAt) })
    .from(usageEvents);

  const [lastAudit] = await db
    .select({ at: max(auditEvents.createdAt) })
    .from(auditEvents);

  const lastApiUsageAt = [lastUsage?.at, lastAudit?.at]
    .filter((value): value is Date => value instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const [storageRow] = await db
    .select({ total: sum(attachments.sizeBytes) })
    .from(attachments);

  const release = getReleaseMeta();
  const deployValue = release.build !== "dev" ? release.build : null;

  return {
    api: {
      status: "healthy",
      message: "الواجهة البرمجية تعمل.",
    },
    database: {
      status: databaseStatus,
      message: databaseMessage,
    },
    release,
    lastDeploy: {
      value: deployValue,
      availability: deployValue ? "available" : "unavailable",
    },
    errorCount: {
      value: null,
      availability: "unavailable",
    },
    failedRequests: {
      value: null,
      availability: "unavailable",
    },
    attachmentsStorageBytes: {
      value: storageRow?.total !== null && storageRow?.total !== undefined
        ? Number(storageRow.total)
        : null,
      availability: "available",
    },
    lastCloseoutAt: lastCloseout?.at?.toISOString() ?? null,
    lastAttachmentAt: lastAttachment?.at?.toISOString() ?? null,
    lastApiUsageAt: lastApiUsageAt?.toISOString() ?? null,
  };
}
