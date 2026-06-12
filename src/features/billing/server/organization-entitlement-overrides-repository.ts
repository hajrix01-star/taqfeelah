import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { organizationEntitlementOverrides } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  maxStoresOverride: z.number().int().positive().nullable().optional(),
  maxEmployeesOverride: z.number().int().positive().nullable().optional(),
  priceMonthlyOverrideHalalas: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export async function upsertOrganizationEntitlementOverrides(
  rawInput: z.infer<typeof inputSchema>,
) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid entitlement override input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const now = new Date();
  const db = getDb();

  await db
    .insert(organizationEntitlementOverrides)
    .values({
      organizationId: input.organizationId,
      maxStoresOverride: input.maxStoresOverride ?? null,
      maxEmployeesOverride: input.maxEmployeesOverride ?? null,
      priceMonthlyOverrideHalalas: input.priceMonthlyOverrideHalalas ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: organizationEntitlementOverrides.organizationId,
      set: {
        maxStoresOverride: input.maxStoresOverride ?? null,
        maxEmployeesOverride: input.maxEmployeesOverride ?? null,
        priceMonthlyOverrideHalalas: input.priceMonthlyOverrideHalalas ?? null,
        notes: input.notes ?? null,
        updatedAt: now,
      },
    });

  const [row] = await db
    .select()
    .from(organizationEntitlementOverrides)
    .where(eq(organizationEntitlementOverrides.organizationId, input.organizationId))
    .limit(1);

  return row;
}
