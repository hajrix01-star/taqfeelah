import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents } from "@/core/db/schema";
import { type MemberRole } from "@/core/auth/roles";
import { ValidationError } from "@/core/errors/app-error";
import { assertStoreAccess } from "@/core/auth/assert-store-access";

const snapshotInputSchema = z.object({
  storeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  totalSalesHalalas: z.number().int().nonnegative(),
  totalOutflowHalalas: z.number().int().nonnegative(),
  note: z.string().trim().max(500).optional(),
});

type SnapshotInput = z.infer<typeof snapshotInputSchema>;

export async function recordStoreDaySummarySnapshot(rawInput: SnapshotInput) {
  const parsed = snapshotInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid summary snapshot input.", parsed.error.flatten());
  }

  const input = parsed.data;
  const db = getDb();
  const actorRole = input.actorRole as MemberRole;
  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole,
    minimumRole: "employee",
  });

  const [created] = await db
    .insert(auditEvents)
    .values({
      organizationId: input.organizationId,
      storeId: input.storeId,
      actorUserId: input.actorUserId,
      action: "summary_snapshot_recorded",
      reason: input.note || null,
      metadata: {
        date: input.date,
        totalSalesHalalas: input.totalSalesHalalas,
        totalOutflowHalalas: input.totalOutflowHalalas,
        netMovementHalalas: input.totalSalesHalalas - input.totalOutflowHalalas,
        source: "api/v1/stores/:storeId/summary/day",
      },
    })
    .returning({ id: auditEvents.id, createdAt: auditEvents.createdAt });

  return created;
}
