import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { attachments, entries } from "@/core/db/schema";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { queryAttachmentStatsForStoreScope } from "@/features/reports/server/attachment-stats-query";
import { assertBoundedReportRange } from "@/features/reports/server/report-date-range";
import { mergeEntryScopeWithCloseoutLink } from "@/features/entries/server/closeout-linked-entry-filter";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function getStoreAttachmentsReport(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid attachments report input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const range = assertBoundedReportRange(input.from, input.to);

  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "employee",
  });

  const db = getDb();
  const entryScope = mergeEntryScopeWithCloseoutLink(
    input.organizationId,
    input.storeId,
    and(
      eq(entries.organizationId, input.organizationId),
      eq(entries.storeId, input.storeId),
      gte(entries.date, range.from),
      lte(entries.date, range.to),
      eq(entries.status, "active"),
      inArray(entries.type, ["summary", "purchases", "expense", "withdrawal"]),
    ),
  );

  const stats = await queryAttachmentStatsForStoreScope(
    db,
    input.organizationId,
    input.storeId,
    entryScope,
  );

  const items = await db
    .select({
      entryId: entries.id,
      date: entries.date,
      type: entries.type,
      amountHalalas: entries.amountHalalas,
      reviewedAt: entries.reviewedAt,
      attachmentId: attachments.id,
      attachmentName: attachments.originalFileName,
      mimeType: attachments.mimeType,
    })
    .from(entries)
    .innerJoin(attachments, eq(attachments.entryId, entries.id))
    .where(entryScope)
    .orderBy(entries.date, entries.createdAt);

  return {
    storeId: input.storeId,
    from: range.from,
    to: range.to,
    attachmentCount: stats.attachmentCount,
    entriesWithAttachments: stats.attachmentCount,
    items: items.map((row) => ({
      entryId: row.entryId,
      date: row.date,
      type: row.type,
      amountHalalas: row.amountHalalas,
      reviewed: Boolean(row.reviewedAt),
      attachment: {
        id: row.attachmentId,
        name: row.attachmentName || "attachment.jpg",
        mimeType: row.mimeType,
      },
    })),
  };
}
