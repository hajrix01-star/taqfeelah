import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents, entries } from "@/core/db/schema";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { assertStoreAccess } from "@/core/auth/assert-store-access";

const reviewInputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  closeoutId: z.string().trim().min(1).max(120),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  action: z.enum(["approve", "return"]),
  reason: z.string().trim().max(500).optional(),
});

type ReviewInput = z.infer<typeof reviewInputSchema>;

const submitMetadataSchema = z.object({
  closeoutId: z.string().trim().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  summaryEntryId: z.string().uuid().optional(),
  outflowEntryIds: z.array(z.string().uuid()).optional(),
});

export async function reviewStoreCloseout(rawInput: ReviewInput) {
  const parsed = reviewInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid closeout review input.", parsed.error.flatten());
  }

  const input = parsed.data;
  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "manager",
  });

  const db = getDb();
  const [latestSubmit] = await db
    .select({
      id: auditEvents.id,
      createdAt: auditEvents.createdAt,
      metadata: auditEvents.metadata,
    })
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.organizationId, input.organizationId),
        eq(auditEvents.storeId, input.storeId),
        sql`${auditEvents.action} in ('closeout_submitted', 'closeout_resubmitted')`,
        sql`${auditEvents.metadata} ->> 'closeoutId' = ${input.closeoutId}`,
        sql`${auditEvents.metadata} ->> 'date' = ${input.date}`,
      ),
    )
    .orderBy(desc(auditEvents.createdAt))
    .limit(1);

  const parsedSubmitMetadata = submitMetadataSchema.safeParse(latestSubmit?.metadata);
  const targetEntryIds = parsedSubmitMetadata.success
    ? [
      ...(parsedSubmitMetadata.data.summaryEntryId ? [parsedSubmitMetadata.data.summaryEntryId] : []),
      ...(parsedSubmitMetadata.data.outflowEntryIds || []),
    ]
    : [];

  const [created] = await db.transaction(async (tx) => {
    if (input.action === "approve" && targetEntryIds.length > 0) {
      await tx
        .update(entries)
        .set({
          status: "active",
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(entries.organizationId, input.organizationId),
            eq(entries.storeId, input.storeId),
            inArray(entries.id, targetEntryIds),
          ),
        );
    }

    return tx
      .insert(auditEvents)
      .values({
        organizationId: input.organizationId,
        storeId: input.storeId,
        actorUserId: input.actorUserId,
        action: input.action === "approve" ? "closeout_approved" : "closeout_returned",
        reason: input.reason || null,
        metadata: {
          closeoutId: input.closeoutId,
          date: input.date,
          sourceSubmissionAuditId: latestSubmit?.id || null,
        },
      })
      .returning({ id: auditEvents.id, createdAt: auditEvents.createdAt });
  });

  return {
    id: created.id,
    createdAt: created.createdAt,
    status: input.action === "approve" ? "reviewed" : "returned",
  };
}
