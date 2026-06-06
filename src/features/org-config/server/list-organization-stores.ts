import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { memberStoreAccess, stores } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { normalizeStoreOperationalSettings } from "@/domain/store-operational-settings/normalize";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  status: z.enum(["active", "archived", "all"]).default("active"),
});

export async function listOrganizationStores(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid stores list input.", parsed.error.flatten());
  }
  const input = parsed.data;

  const access = await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "employee",
  });

  const db = getDb();
  let allowedStoreIds: string[] | null = null;
  if (access.memberRole === "employee") {
    const accessRows = await db
      .select({ storeId: memberStoreAccess.storeId })
      .from(memberStoreAccess)
      .where(eq(memberStoreAccess.organizationMemberId, access.memberId));
    allowedStoreIds = accessRows.map((row) => row.storeId);
    if (!allowedStoreIds.length) {
      return { stores: [] };
    }
  }

  const rows = await db
    .select({
      id: stores.id,
      name: stores.name,
      location: stores.location,
      status: stores.status,
      operationalSettings: stores.operationalSettings,
      createdAt: stores.createdAt,
      updatedAt: stores.updatedAt,
    })
    .from(stores)
    .where(
      and(
        eq(stores.organizationId, input.organizationId),
        input.status === "all" ? undefined : eq(stores.status, input.status),
        allowedStoreIds ? inArray(stores.id, allowedStoreIds) : undefined,
      ),
    )
    .orderBy(asc(stores.name), asc(stores.id));

  return {
    stores: rows.map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location || "",
      status: row.status,
      operationalSettings: normalizeStoreOperationalSettings(row.operationalSettings),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}
