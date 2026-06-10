import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { getDb } from "@/core/db/client";
import { attachments, auditEvents, dailyCloseouts, entries, entrySalesChannels, users } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { decodeEntryListCursor, encodeEntryListCursor } from "./entry-list-cursor";
import {
  closeoutLinkedEntryScope,
  includeListedEntryRow,
} from "./closeout-linked-entry-filter";

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
  cursor: z.string().trim().min(1).optional(),
  paginated: z.boolean().default(false),
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

function cursorBeforeClause(cursor: ReturnType<typeof decodeEntryListCursor>) {
  return or(
    sql`${entries.date} < ${cursor.date}`,
    and(
      eq(entries.date, cursor.date),
      sql`${entries.createdAt} < ${cursor.createdAt}`,
    ),
    and(
      eq(entries.date, cursor.date),
      sql`${entries.createdAt} = ${cursor.createdAt}`,
      sql`${entries.id} < ${cursor.id}`,
    ),
  );
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

  const effectiveLimit = input.paginated
    ? Math.min(input.limit, 100)
    : input.limit;

  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "employee",
  });

  const decodedCursor = input.cursor ? decodeEntryListCursor(input.cursor) : null;

  const db = getDb();
  const linkedScope = closeoutLinkedEntryScope(input.organizationId, input.storeId);
  const rows = await db
    .select({
      id: entries.id,
      storeId: entries.storeId,
      closeoutId: entries.closeoutId,
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
        decodedCursor ? cursorBeforeClause(decodedCursor) : undefined,
        linkedScope,
      ),
    )
    .orderBy(desc(entries.date), desc(entries.createdAt), desc(entries.id))
    .limit(effectiveLimit + 1);

  const closeoutIds = [...new Set(rows.map((row) => row.closeoutId).filter(Boolean))] as string[];
  const closeoutMetaById = new Map<string, {
    clientCloseoutId: string;
    daySequence: number;
    status: string;
  }>();

  if (closeoutIds.length > 0) {
    const closeoutRows = await db
      .select({
        id: dailyCloseouts.id,
        clientCloseoutId: dailyCloseouts.clientCloseoutId,
        daySequence: dailyCloseouts.daySequence,
        status: dailyCloseouts.status,
      })
      .from(dailyCloseouts)
      .where(
        and(
          eq(dailyCloseouts.organizationId, input.organizationId),
          eq(dailyCloseouts.storeId, input.storeId),
          inArray(dailyCloseouts.id, closeoutIds),
        ),
      );

    closeoutRows.forEach((row) => {
      closeoutMetaById.set(row.id, {
        clientCloseoutId: row.clientCloseoutId,
        daySequence: row.daySequence,
        status: row.status,
      });
    });
  }

  const filteredRows = rows.filter((row) => includeListedEntryRow(row, closeoutMetaById));

  const hasMore = filteredRows.length > effectiveLimit;
  const pageRows = hasMore ? filteredRows.slice(0, effectiveLimit) : filteredRows;

  const entryIds = pageRows.map((row) => row.id);
  if (entryIds.length === 0) {
    return { items: [], nextCursor: null };
  }

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
  pageRows.forEach((row) => actorIds.add(row.enteredByUserId));
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

  const items = pageRows.map((row) => {
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
      closeoutId: row.closeoutId
        ? closeoutMetaById.get(row.closeoutId)?.clientCloseoutId || null
        : null,
      daySequence: row.closeoutId
        ? closeoutMetaById.get(row.closeoutId)?.daySequence ?? null
        : null,
      outflowId: null,
      enteredBy: createdBy,
      attachment: attachment
        ? {
          id: attachment.id,
          kind: "image",
          name: attachment.name,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
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

  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && lastRow
    ? encodeEntryListCursor({
      date: lastRow.date,
      createdAt: lastRow.createdAt,
      id: lastRow.id,
    })
    : null;

  return { items, nextCursor };
}
