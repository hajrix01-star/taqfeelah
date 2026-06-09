import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents, dailyCloseouts, entries } from "@/core/db/schema";
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
  const [closeoutRow] = await db
    .select({ id: dailyCloseouts.id })
    .from(dailyCloseouts)
    .where(
      and(
        eq(dailyCloseouts.organizationId, input.organizationId),
        eq(dailyCloseouts.storeId, input.storeId),
        eq(dailyCloseouts.clientCloseoutId, input.closeoutId),
        eq(dailyCloseouts.date, input.date),
      ),
    )
    .limit(1);

  if (!closeoutRow) {
    throw new ValidationError("Closeout not found for review.");
  }

  const nextStatus = input.action === "approve" ? "approved" : "returned";
  const reviewedAt = new Date();

  const [created] = await db.transaction(async (tx) => {
    if (input.action === "approve") {
      await tx
        .update(entries)
        .set({
          status: "active",
          reviewedAt,
        })
        .where(
          and(
            eq(entries.organizationId, input.organizationId),
            eq(entries.storeId, input.storeId),
            eq(entries.closeoutId, closeoutRow.id),
          ),
        );
    }

    await tx
      .update(dailyCloseouts)
      .set({
        status: nextStatus,
        reviewedByUserId: input.actorUserId,
        reviewedAt,
        returnReason: input.action === "return" ? input.reason || null : null,
        updatedAt: reviewedAt,
      })
      .where(eq(dailyCloseouts.id, closeoutRow.id));

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
          dailyCloseoutId: closeoutRow.id,
          date: input.date,
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
