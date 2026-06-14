import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { getDb } from "@/core/db/client";
import { auditEvents, dailyCloseouts, entries } from "@/core/db/schema";
import { ForbiddenError, ValidationError } from "@/core/errors/app-error";

const deleteCloseoutInputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  clientCloseoutId: z.string().trim().min(1).max(120),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
});

type DeleteCloseoutInput = z.infer<typeof deleteCloseoutInputSchema>;

export async function deleteStoreCloseout(rawInput: DeleteCloseoutInput) {
  const parsed = deleteCloseoutInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid closeout delete input.", parsed.error.flatten());
  }

  const input = parsed.data;
  if (input.actorRole === "employee") {
    throw new ForbiddenError("Only owner or manager can delete a closeout.");
  }

  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "manager",
  });

  const db = getDb();
  const [closeoutRow] = await db
    .select({
      id: dailyCloseouts.id,
      date: dailyCloseouts.date,
      clientCloseoutId: dailyCloseouts.clientCloseoutId,
    })
    .from(dailyCloseouts)
    .where(
      and(
        eq(dailyCloseouts.organizationId, input.organizationId),
        eq(dailyCloseouts.storeId, input.storeId),
        eq(dailyCloseouts.clientCloseoutId, input.clientCloseoutId),
      ),
    )
    .limit(1);

  if (!closeoutRow) {
    throw new ValidationError("Closeout not found.");
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(entries)
      .where(
        and(
          eq(entries.organizationId, input.organizationId),
          eq(entries.storeId, input.storeId),
          eq(entries.closeoutId, closeoutRow.id),
        ),
      );

    await tx
      .delete(dailyCloseouts)
      .where(
        and(
          eq(dailyCloseouts.organizationId, input.organizationId),
          eq(dailyCloseouts.storeId, input.storeId),
          eq(dailyCloseouts.id, closeoutRow.id),
        ),
      );

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      storeId: input.storeId,
      actorUserId: input.actorUserId,
      action: "closeout_deleted",
      reason: null,
      metadata: {
        closeoutId: closeoutRow.clientCloseoutId,
        date: closeoutRow.date,
      },
    });
  });

  return {
    deleted: true,
    clientCloseoutId: closeoutRow.clientCloseoutId,
    date: closeoutRow.date,
  };
}
