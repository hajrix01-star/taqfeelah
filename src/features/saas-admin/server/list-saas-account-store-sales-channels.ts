import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { salesChannels } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { assertSaasStoreBelongsToOrg } from "@/features/saas-admin/server/assert-saas-store-belongs-to-org";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  status: z.enum(["active", "retired", "all"]).default("all"),
});

export async function listSaasAccountStoreSalesChannels(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid sales channels list input.", parsed.error.flatten());
  }
  const input = parsed.data;

  const db = getDb();
  await assertSaasStoreBelongsToOrg(db, input.organizationId, input.storeId);

  const rows = await db
    .select({
      id: salesChannels.id,
      name: salesChannels.name,
      status: salesChannels.status,
      retiredAt: salesChannels.retiredAt,
      createdAt: salesChannels.createdAt,
    })
    .from(salesChannels)
    .where(
      and(
        eq(salesChannels.organizationId, input.organizationId),
        eq(salesChannels.storeId, input.storeId),
        input.status === "all" ? undefined : eq(salesChannels.status, input.status),
      ),
    )
    .orderBy(asc(salesChannels.name), asc(salesChannels.id));

  return {
    storeId: input.storeId,
    channels: rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      retiredAt: row.retiredAt ? row.retiredAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
