import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { memberStoreAccess, salesChannels, stores } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { normalizeStoreOperationalSettings } from "@/domain/store-operational-settings/normalize";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  storeStatus: z.enum(["active", "archived", "all"]).default("all"),
  channelStatus: z.enum(["active", "retired", "all"]).default("all"),
});

export async function getOrganizationStoresChannelsBundle(rawInput: z.input<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid stores/channels bundle input.", parsed.error.flatten());
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
      return { stores: [], channelsByStoreId: {} as Record<string, Array<{
        id: string;
        name: string;
        status: string;
        retiredAt: string | null;
        createdAt: string;
      }>> };
    }
  }

  const storeRows = await db
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
        input.storeStatus === "all" ? undefined : eq(stores.status, input.storeStatus),
        allowedStoreIds ? inArray(stores.id, allowedStoreIds) : undefined,
      ),
    )
    .orderBy(asc(stores.name), asc(stores.id));

  const storeIds = storeRows.map((row) => row.id);
  const channelsByStoreId: Record<string, Array<{
    id: string;
    name: string;
    status: string;
    retiredAt: string | null;
    createdAt: string;
  }>> = {};

  storeIds.forEach((storeId) => {
    channelsByStoreId[storeId] = [];
  });

  if (storeIds.length > 0) {
    const channelRows = await db
      .select({
        id: salesChannels.id,
        storeId: salesChannels.storeId,
        name: salesChannels.name,
        status: salesChannels.status,
        retiredAt: salesChannels.retiredAt,
        createdAt: salesChannels.createdAt,
      })
      .from(salesChannels)
      .where(
        and(
          eq(salesChannels.organizationId, input.organizationId),
          inArray(salesChannels.storeId, storeIds),
          input.channelStatus === "all" ? undefined : eq(salesChannels.status, input.channelStatus),
        ),
      )
      .orderBy(asc(salesChannels.storeId), asc(salesChannels.name), asc(salesChannels.id));

    channelRows.forEach((row) => {
      const current = channelsByStoreId[row.storeId] || [];
      current.push({
        id: row.id,
        name: row.name,
        status: row.status,
        retiredAt: row.retiredAt ? row.retiredAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      });
      channelsByStoreId[row.storeId] = current;
    });
  }

  return {
    stores: storeRows.map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location || "",
      status: row.status,
      operationalSettings: normalizeStoreOperationalSettings(row.operationalSettings),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    channelsByStoreId,
  };
}
