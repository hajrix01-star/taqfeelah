import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { getDb } from "@/core/db/client";
import { auditEvents, entries, entrySalesChannels, users } from "@/core/db/schema";
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

  const entryIds = rows.map((row) => row.id);
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

  const actorIds = [...new Set(rows.map((row) => row.enteredByUserId))];
  const actorRows = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(inArray(users.id, actorIds));
  const actorNameById = new Map<string, string>();
  actorRows.forEach((actorRow) => actorNameById.set(actorRow.id, actorRow.name));

  const closeoutAuditRows = await db
    .select({
      metadata: auditEvents.metadata,
    })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.organizationId, input.organizationId),
        eq(auditEvents.storeId, input.storeId),
        inArray(auditEvents.action, ["closeout_submitted", "closeout_resubmitted"]),
        input.dateFrom ? sql`${auditEvents.metadata} ->> 'date' >= ${input.dateFrom}` : undefined,
        input.dateTo ? sql`${auditEvents.metadata} ->> 'date' <= ${input.dateTo}` : undefined,
      ),
    );

  const closeoutIdByEntryId = new Map<string, string>();
  closeoutAuditRows.forEach((row) => {
    const parsedMetadata = closeoutSubmitMetadataSchema.safeParse(row.metadata);
    if (!parsedMetadata.success) return;
    const metadata = parsedMetadata.data;
    if (metadata.summaryEntryId) {
      closeoutIdByEntryId.set(metadata.summaryEntryId, metadata.closeoutId);
    }
    (metadata.outflowEntryIds || []).forEach((entryId) => {
      closeoutIdByEntryId.set(entryId, metadata.closeoutId);
    });
  });

  return rows.map((row) => {
    const actorName = actorNameById.get(row.enteredByUserId) || "";
    const createdAt = toIso(row.createdAt);
    const createdBy = {
      role: "employee",
      userId: row.enteredByUserId,
      nameAr: actorName,
      nameEn: actorName,
    };

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
      outflowId: null,
      enteredBy: createdBy,
      attachment: null,
      reviewed: Boolean(row.reviewedAt),
      reviewedAt: toIso(row.reviewedAt),
      reviewedBy: null,
      status: row.status,
      voidedAt: toIso(row.voidedAt),
      voidedBy: null,
      voidReason: "",
      restoredAt: toIso(row.restoredAt),
      restoredBy: null,
      restoreReason: "",
      auditTrail: createdAt ? [{ action: "created", at: createdAt, by: createdBy, reason: "" }] : [],
    };
  });
}
