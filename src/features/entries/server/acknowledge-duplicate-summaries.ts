import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { getDb } from "@/core/db/client";
import { auditEvents, entries } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entryIds: z.array(z.string().uuid()).min(1).max(20),
});

export async function acknowledgeDuplicateSummaries(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid duplicate summary acknowledge input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "owner",
  });

  const db = getDb();
  const rows = await db
    .select({ id: entries.id })
    .from(entries)
    .where(
      and(
        eq(entries.organizationId, input.organizationId),
        eq(entries.storeId, input.storeId),
        eq(entries.date, input.date),
        eq(entries.type, "summary"),
        eq(entries.status, "active"),
        inArray(entries.id, input.entryIds),
      ),
    );

  if (rows.length !== input.entryIds.length) {
    throw new ValidationError("One or more summary entries were not found for acknowledgement.");
  }

  await db.insert(auditEvents).values(
    rows.map((row) => ({
      organizationId: input.organizationId,
      storeId: input.storeId,
      entryId: row.id,
      actorUserId: input.actorUserId,
      action: "duplicate_approved",
      metadata: {
        date: input.date,
        mode: "acknowledge_existing",
        entryIds: input.entryIds,
      },
    })),
  );

  return {
    acknowledgedEntryIds: rows.map((row) => row.id),
    date: input.date,
  };
}
