import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents } from "@/core/db/schema";
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

  const [created] = await db
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

  return {
    id: created.id,
    createdAt: created.createdAt,
    status: input.action === "approve" ? "reviewed" : "returned",
  };
}
