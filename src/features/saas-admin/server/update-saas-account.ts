import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents, organizations, subscriptions } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

import { PLAN_CODES } from "@/features/billing/plan-codes";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["active", "suspended", "archived"]).optional(),
  planCode: z.enum(PLAN_CODES).optional(),
});

export async function updateSaasAccount(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS account update input.", parsed.error.flatten());
  }
  const input = parsed.data;

  if (!input.name && !input.status && !input.planCode) {
    throw new ValidationError("At least one field must be provided to update.");
  }

  const db = getDb();
  const [existing] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      status: organizations.status,
    })
    .from(organizations)
    .where(eq(organizations.id, input.organizationId))
    .limit(1);

  if (!existing?.id) {
    throw new ValidationError("Organization was not found.");
  }

  const now = new Date();
  const nextName = input.name?.trim() || existing.name;
  const nextStatus = input.status || existing.status;

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(organizations)
      .set({
        name: nextName,
        status: nextStatus,
        updatedAt: now,
      })
      .where(eq(organizations.id, input.organizationId))
      .returning({
        id: organizations.id,
        name: organizations.name,
        status: organizations.status,
        updatedAt: organizations.updatedAt,
      });

    let nextPlanCode: string | null = null;
    if (input.planCode) {
      const [subscription] = await tx
        .select({ id: subscriptions.id, planCode: subscriptions.planCode })
        .from(subscriptions)
        .where(eq(subscriptions.organizationId, input.organizationId))
        .orderBy(desc(subscriptions.updatedAt))
        .limit(1);

      if (!subscription?.id) {
        throw new ValidationError("Subscription was not found for this organization.");
      }

      const [updatedSubscription] = await tx
        .update(subscriptions)
        .set({
          planCode: input.planCode,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, subscription.id))
        .returning({ planCode: subscriptions.planCode });

      nextPlanCode = updatedSubscription.planCode;
    }

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: "saas_account_updated",
      metadata: {
        previousName: existing.name,
        previousStatus: existing.status,
        nextName: updated.name,
        nextStatus: updated.status,
        nextPlanCode,
      },
    });

    return {
      organizationId: updated.id,
      organizationName: updated.name,
      status: updated.status,
      planCode: nextPlanCode,
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}
