import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { assertStoreAccess } from "@/core/auth/assert-store-access";
import { type MemberRole } from "@/core/auth/roles";
import { getDb } from "@/core/db/client";
import { outflowCategories } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  storeId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  status: z.enum(["active", "retired", "all"]).default("all"),
});

export async function listStoreOutflowCategories(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid outflow categories list input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertStoreAccess({
    organizationId: input.organizationId,
    storeId: input.storeId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as MemberRole,
    minimumRole: "employee",
  });

  const db = getDb();
  const rows = await db
    .select({
      id: outflowCategories.id,
      name: outflowCategories.name,
      status: outflowCategories.status,
      retiredAt: outflowCategories.retiredAt,
      createdAt: outflowCategories.createdAt,
    })
    .from(outflowCategories)
    .where(
      and(
        eq(outflowCategories.organizationId, input.organizationId),
        eq(outflowCategories.storeId, input.storeId),
        input.status === "all" ? undefined : eq(outflowCategories.status, input.status),
      ),
    )
    .orderBy(asc(outflowCategories.name), asc(outflowCategories.id));

  return {
    storeId: input.storeId,
    categories: rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      retiredAt: row.retiredAt ? row.retiredAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
