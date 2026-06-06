import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { getDb } from "@/core/db/client";
import { attachments, auditEvents, entries, entrySalesChannels, users } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  status: z.enum(["active", "voided", "all"]).default("all"),
  limit: z.number().int().min(1).max(1000).default(500),
});

const closeoutSubmitMetadataSchema = z.object({
  closeoutId: z.string().trim().min(1).max(120),
  date: dateSchema,
  summaryEntryId: z.string().uuid().optional(),
  outflowEntryIds: z.array(z.string().uuid()).optional(),
  daySequence: z.coerce.number().int().positive().optional(),
});

const closeoutReviewMetadataSchema = z.object({
  closeoutId: z.string().trim().min(1).max(120),
  date: dateSchema,
});

type Input = z.infer<typeof inputSchema>;

function toRiyals(halalas: number): number {
  return Number((halalas / 100).toFixed(2));
}

function toIso(value: string | Date | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  const timestamp = value.getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export async function listStoreEntries(rawInput: Input) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid entries list input.", parsed.error.flatten());
  }
  const input = parsed.data;

  if (input.dateFrom && input.dateTo && input.dateFrom > input.dateTo) {
    throw new ValidationError("dateFrom must be earlier than or equal to dateTo.");
  }

  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "employee",
  });

  const db = getDb();
  const rows = await db
    .select({
      id: entries.id,
      storeId: entries.storeId,
      date: entries.date,
      createdAt: entries.createdAt,
      type: entries.type,
      categoryId: entries.categoryId,
      amountHalalas: entries.amountHalalas,
      note: entries.note,
      enteredByUserId: entries.enteredByUserId,
      status: entries.status,
      reviewedAt: entries.reviewedAt,
      voidedAt: entries.voidedAt,
      restoredAt: entries.restoredAt,
    })
    .from(entries)
    .where(
      and(
        eq(entries.organizationId, input.organizationId),
        eq(entries.storeId, input.storeId),
        input.dateFrom ? sql`${entries.date} >= ${input.dateFrom}` : undefined,
        input.dateTo ? sql`${entries.date} <= ${input.dateTo}` : undefined,
        input.status === "all" ? undefined : eq(entries.status, input.status),
      ),
    )
    .orderBy(desc(entries.date), desc(entries.createdAt), desc(entries.id))
    .limit(input.limit);

  const closeoutAuditRows = await db
    .select({
      action: auditEvents.action,
      actorUserId: auditEvents.actorUserId,
      createdAt: auditEvents.createdAt,
      reason: auditEvents.reason,
      metadata: auditEvents.metadata,
    })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.organizationId, input.organizationId),
        eq(auditEvents.storeId, input.storeId),
        inArray(auditEvents.action, [
          "closeout_submitted",
          "closeout_resubmitted",
          "closeout_approved",
          "closeout_returned",
        ]),
        input.dateFrom ? sql`${auditEvents.metadata} ->> 'date' >= ${input.dateFrom}` : undefined,
        input.dateTo ? sql`${auditEvents.metadata} ->> 'date' <= ${input.dateTo}` : undefined,
      ),
    );

  const closeoutIdByEntryId = new Map<string, string>();
  const closeoutDaySequenceByKey = new Map<string, number>();
  const closeoutStateByKey = new Map<string, { submittedAt: number; approvedAt: number; returnedAt: number }>();
  closeoutAuditRows.forEach((row) => {
    if (row.action === "closeout_submitted" || row.action === "closeout_resubmitted") {
      const parsedMetadata = closeoutSubmitMetadataSchema.safeParse(row.metadata);
      if (!parsedMetadata.success) return;
      const metadata = parsedMetadata.data;
      if (metadata.summaryEntryId) {
        closeoutIdByEntryId.set(metadata.summaryEntryId, metadata.closeoutId);
      }
      (metadata.outflowEntryIds || []).forEach((entryId) => {
        closeoutIdByEntryId.set(entryId, metadata.closeoutId);
      });
      const key = `${metadata.closeoutId}:${metadata.date}`;
      if (metadata.daySequence) {
        closeoutDaySequenceByKey.set(key, metadata.daySequence);
      }
      const currentState = closeoutStateByKey.get(key) || {
        submittedAt: 0,
        approvedAt: 0,
        returnedAt: 0,
      };
      currentState.submittedAt = Math.max(currentState.submittedAt, row.createdAt.getTime());
      closeoutStateByKey.set(key, currentState);
      return;
    }

    const parsedMetadata = closeoutReviewMetadataSchema.safeParse(row.metadata);
    if (!parsedMetadata.success) return;
    const metadata = parsedMetadata.data;
    const key = `${metadata.closeoutId}:${metadata.date}`;
    const currentState = closeoutStateByKey.get(key) || {
      submittedAt: 0,
      approvedAt: 0,
      returnedAt: 0,
    };
    const createdAtMs = row.createdAt.getTime();
    if (row.action === "closeout_approved") {
      currentState.approvedAt = Math.max(currentState.approvedAt, createdAtMs);
    } else if (row.action === "closeout_returned") {
      currentState.returnedAt = Math.max(currentState.returnedAt, createdAtMs);
    }
    closeoutStateByKey.set(key, currentState);
  });

  const closeoutStatusByKey = new Map<string, "submitted" | "reviewed" | "returned">();
  closeoutStateByKey.forEach((state, key) => {
    if (state.submittedAt === 0) {
      closeoutStatusByKey.set(key, "submitted");
      return;
    }
    if (state.approvedAt >= state.submittedAt && state.approvedAt >= state.returnedAt) {
      closeoutStatusByKey.set(key, "reviewed");
      return;
    }
    if (state.returnedAt >= state.submittedAt && state.returnedAt >= state.approvedAt) {
      closeoutStatusByKey.set(key, "returned");
      return;
    }
    closeoutStatusByKey.set(key, "submitted");
  });

  const filteredRows = rows.filter((row) => {
    const closeoutId = closeoutIdByEntryId.get(row.id);
    if (!closeoutId) return true;
    const status = closeoutStatusByKey.get(`${closeoutId}:${row.date}`);
    return status === "reviewed";
  });

  const entryIds = filteredRows.map((row) => row.id);
  if (entryIds.length === 0) return [];

  const salesRows = await db
    .select({
      entryId: entrySalesChannels.entryId,
      salesChannelId: entrySalesChannels.salesChannelId,
      channelNameSnapshot: entrySalesChannels.channelNameSnapshot,
      amountHalalas: entrySalesChannels.amountHalalas,
    })
    .from(entrySalesChannels)
    .where(
      and(
        eq(entrySalesChannels.organizationId, input.organizationId),
        eq(entrySalesChannels.storeId, input.storeId),
        inArray(entrySalesChannels.entryId, entryIds),
      ),
    );

  const salesByEntryId = new Map<string, Array<{ channelId: string; name: string; amount: number }>>();
  salesRows.forEach((row) => {
    const current = salesByEntryId.get(row.entryId) || [];
    current.push({
      channelId: row.salesChannelId,
      name: row.channelNameSnapshot,
      amount: toRiyals(row.amountHalalas),
    });
    salesByEntryId.set(row.entryId, current);
  });

  const attachmentRows = await db
    .select({
      id: attachments.id,
      entryId: attachments.entryId,
      storageKey: attachments.storageKey,
      originalFileName: attachments.originalFileName,
      mimeType: attachments.mimeType,
      sizeBytes: attachments.sizeBytes,
      createdAt: attachments.createdAt,
    })
    .from(attachments)
    .where(
      and(
        eq(attachments.organizationId, input.organizationId),
        eq(attachments.storeId, input.storeId),
        inArray(attachments.entryId, entryIds),
      ),
    );

  const attachmentByEntryId = new Map<
    string,
    {
      id: string;
      dataUrl: string;
      name: string;
      mimeType: string;
      sizeBytes: number;
      createdAt: Date;
    }
  >();
  attachmentRows.forEach((row) => {
    const current = attachmentByEntryId.get(row.entryId);
    if (!current || row.createdAt > current.createdAt) {
      attachmentByEntryId.set(row.entryId, {
        id: row.id,
        dataUrl: row.storageKey,
        name: row.originalFileName || "attachment.jpg",
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
        createdAt: row.createdAt,
      });
    }
  });

  const entryAuditRows = await db
    .select({
      entryId: auditEvents.entryId,
      action: auditEvents.action,
      actorUserId: auditEvents.actorUserId,
      reason: auditEvents.reason,
      createdAt: auditEvents.createdAt,
    })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.organizationId, input.organizationId),
        eq(auditEvents.storeId, input.storeId),
        inArray(auditEvents.action, ["entry_reviewed", "entry_voided", "entry_restored"]),
        inArray(auditEvents.entryId, entryIds),
      ),
    );

  const latestAuditByEntryId = new Map<
    string,
    {
      reviewed?: { actorUserId: string; reason: string | null; createdAt: Date };
      voided?: { actorUserId: string; reason: string | null; createdAt: Date };
      restored?: { actorUserId: string; reason: string | null; createdAt: Date };
    }
  >();
  entryAuditRows.forEach((row) => {
    if (!row.entryId) return;
    const current = latestAuditByEntryId.get(row.entryId) || {};
    if (row.action === "entry_reviewed") {
      if (!current.reviewed || row.createdAt > current.reviewed.createdAt) {
        current.reviewed = { actorUserId: row.actorUserId, reason: row.reason, createdAt: row.createdAt };
      }
    } else if (row.action === "entry_voided") {
      if (!current.voided || row.createdAt > current.voided.createdAt) {
        current.voided = { actorUserId: row.actorUserId, reason: row.reason, createdAt: row.createdAt };
      }
    } else if (row.action === "entry_restored") {
      if (!current.restored || row.createdAt > current.restored.createdAt) {
        current.restored = { actorUserId: row.actorUserId, reason: row.reason, createdAt: row.createdAt };
      }
    }
    latestAuditByEntryId.set(row.entryId, current);
  });

  const actorIds = new Set<string>();
  filteredRows.forEach((row) => actorIds.add(row.enteredByUserId));
  entryAuditRows.forEach((row) => actorIds.add(row.actorUserId));

  const actorRows = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(inArray(users.id, [...actorIds]));

  const actorNameById = new Map<string, string>();
  actorRows.forEach((actorRow) => actorNameById.set(actorRow.id, actorRow.name));

  const actorById = (userId: string) => {
    const name = actorNameById.get(userId) || "";
    return {
      role: "owner",
      userId,
      nameAr: name,
      nameEn: name,
    };
  };

  return filteredRows.map((row) => {
    const actorName = actorNameById.get(row.enteredByUserId) || "";
    const createdAt = toIso(row.createdAt);
    const createdBy = {
      role: "employee",
      userId: row.enteredByUserId,
      nameAr: actorName,
      nameEn: actorName,
    };
    const latestAudit = latestAuditByEntryId.get(row.id);
    const attachment = attachmentByEntryId.get(row.id);
    const reviewedAt = toIso(row.reviewedAt) || toIso(latestAudit?.reviewed?.createdAt || null);
    const voidedAt = toIso(row.voidedAt) || toIso(latestAudit?.voided?.createdAt || null);
    const restoredAt = toIso(row.restoredAt) || toIso(latestAudit?.restored?.createdAt || null);

    const auditTrail = [];
    if (createdAt) {
      auditTrail.push({ action: "created", at: createdAt, by: createdBy, reason: "" });
    }
    if (latestAudit?.reviewed) {
      auditTrail.push({
        action: "reviewed",
        at: toIso(latestAudit.reviewed.createdAt) || createdAt || new Date().toISOString(),
        by: actorById(latestAudit.reviewed.actorUserId),
        reason: latestAudit.reviewed.reason || "",
      });
    }
    if (latestAudit?.voided) {
      auditTrail.push({
        action: "voided",
        at: toIso(latestAudit.voided.createdAt) || createdAt || new Date().toISOString(),
        by: actorById(latestAudit.voided.actorUserId),
        reason: latestAudit.voided.reason || "",
      });
    }
    if (latestAudit?.restored) {
      auditTrail.push({
        action: "restored",
        at: toIso(latestAudit.restored.createdAt) || createdAt || new Date().toISOString(),
        by: actorById(latestAudit.restored.actorUserId),
        reason: latestAudit.restored.reason || "",
      });
    }
    auditTrail.sort((a, b) => String(a.at).localeCompare(String(b.at)));

    return {
      id: row.id,
      businessId: row.storeId,
      date: row.date,
      createdAt,
      type: row.type,
      categoryId: row.categoryId || null,
      amount: toRiyals(row.amountHalalas),
      salesChannels: salesByEntryId.get(row.id) || [],
      note: row.note || "",
      noteKey: null,
      closeoutId: closeoutIdByEntryId.get(row.id) || null,
      daySequence: (() => {
        const closeoutId = closeoutIdByEntryId.get(row.id);
        if (!closeoutId) return null;
        return closeoutDaySequenceByKey.get(`${closeoutId}:${row.date}`) ?? null;
      })(),
      outflowId: null,
      enteredBy: createdBy,
      attachment: attachment
        ? {
          id: attachment.id,
          kind: "image",
          name: attachment.name,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          dataUrl: attachment.dataUrl,
        }
        : null,
      reviewed: Boolean(reviewedAt),
      reviewedAt,
      reviewedBy: latestAudit?.reviewed ? actorById(latestAudit.reviewed.actorUserId) : null,
      status: row.status,
      voidedAt,
      voidedBy: latestAudit?.voided ? actorById(latestAudit.voided.actorUserId) : null,
      voidReason: latestAudit?.voided?.reason || "",
      restoredAt,
      restoredBy: latestAudit?.restored ? actorById(latestAudit.restored.actorUserId) : null,
      restoreReason: latestAudit?.restored?.reason || "",
      auditTrail,
    };
  });
}
