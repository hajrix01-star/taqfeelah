import { and, desc, eq, inArray } from "drizzle-orm";
import type { getDb } from "@/core/db/client";
import { auditEvents, users } from "@/core/db/schema";

export type CloseoutOwnerEditMeta = {
  ownerEditedAt: string;
  ownerEditedByUserId: string;
  ownerEditedByName: string;
};

type Db = ReturnType<typeof getDb>;

function readMetadataCloseoutKeys(metadata: unknown): { dailyCloseoutId: string | null; clientCloseoutId: string | null } {
  if (!metadata || typeof metadata !== "object") {
    return { dailyCloseoutId: null, clientCloseoutId: null };
  }
  const record = metadata as Record<string, unknown>;
  const dailyCloseoutId = typeof record.dailyCloseoutId === "string" ? record.dailyCloseoutId : null;
  const clientCloseoutId = typeof record.closeoutId === "string" ? record.closeoutId : null;
  return { dailyCloseoutId, clientCloseoutId };
}

/**
 * Latest owner edit (`closeout_resubmitted`) per closeout row id and client closeout id.
 */
export async function loadCloseoutOwnerEditMetaByCloseoutId(
  db: Db,
  input: {
    organizationId: string;
    storeId: string;
    closeoutRowIds?: string[];
    clientCloseoutIds?: string[];
  },
): Promise<{
  byDailyCloseoutId: Map<string, CloseoutOwnerEditMeta>;
  byClientCloseoutId: Map<string, CloseoutOwnerEditMeta>;
}> {
  const byDailyCloseoutId = new Map<string, CloseoutOwnerEditMeta>();
  const byClientCloseoutId = new Map<string, CloseoutOwnerEditMeta>();

  const closeoutRowIds = [...new Set((input.closeoutRowIds || []).filter(Boolean))];
  const clientCloseoutIds = [...new Set((input.clientCloseoutIds || []).filter(Boolean))];
  if (closeoutRowIds.length === 0 && clientCloseoutIds.length === 0) {
    return { byDailyCloseoutId, byClientCloseoutId };
  }

  const auditRows = await db
    .select({
      actorUserId: auditEvents.actorUserId,
      createdAt: auditEvents.createdAt,
      metadata: auditEvents.metadata,
    })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.organizationId, input.organizationId),
        eq(auditEvents.storeId, input.storeId),
        eq(auditEvents.action, "closeout_resubmitted"),
      ),
    )
    .orderBy(desc(auditEvents.createdAt));

  const relevantDailyIds = new Set(closeoutRowIds);
  const relevantClientIds = new Set(clientCloseoutIds);
  const actorIds = new Set<string>();

  auditRows.forEach((row) => {
    const { dailyCloseoutId, clientCloseoutId } = readMetadataCloseoutKeys(row.metadata);
    const matchesDaily = dailyCloseoutId && relevantDailyIds.has(dailyCloseoutId);
    const matchesClient = clientCloseoutId && relevantClientIds.has(clientCloseoutId);
    if (!matchesDaily && !matchesClient) return;
    if (matchesDaily && byDailyCloseoutId.has(dailyCloseoutId!)) return;
    if (matchesClient && byClientCloseoutId.has(clientCloseoutId!)) return;

    actorIds.add(row.actorUserId);
    const meta: CloseoutOwnerEditMeta = {
      ownerEditedAt: row.createdAt.toISOString(),
      ownerEditedByUserId: row.actorUserId,
      ownerEditedByName: "",
    };
    if (matchesDaily && dailyCloseoutId) byDailyCloseoutId.set(dailyCloseoutId, meta);
    if (matchesClient && clientCloseoutId) byClientCloseoutId.set(clientCloseoutId, meta);
  });

  if (actorIds.size === 0) {
    return { byDailyCloseoutId, byClientCloseoutId };
  }

  const actorRows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, [...actorIds]));

  const actorNameById = new Map(actorRows.map((row) => [row.id, row.name]));

  byDailyCloseoutId.forEach((meta, key) => {
    byDailyCloseoutId.set(key, {
      ...meta,
      ownerEditedByName: actorNameById.get(meta.ownerEditedByUserId) || "",
    });
  });
  byClientCloseoutId.forEach((meta, key) => {
    byClientCloseoutId.set(key, {
      ...meta,
      ownerEditedByName: actorNameById.get(meta.ownerEditedByUserId) || "",
    });
  });

  return { byDailyCloseoutId, byClientCloseoutId };
}
