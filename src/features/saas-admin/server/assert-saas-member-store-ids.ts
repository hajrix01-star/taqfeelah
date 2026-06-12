import { and, eq, inArray } from "drizzle-orm";
import type { getDb } from "@/core/db/client";
import { stores } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { ERROR_CODES } from "@/core/errors/error-codes";
import { catalogAppError } from "@/core/errors/normalize-error";

type DbClient = Pick<ReturnType<typeof getDb>, "select">;

export async function assertSaasMemberStoreIds(
  db: DbClient,
  organizationId: string,
  storeIds: string[],
) {
  const uniqueStoreIds = [...new Set(storeIds)];
  if (!uniqueStoreIds.length) {
    return uniqueStoreIds;
  }

  const storeRows = await db
    .select({ id: stores.id, status: stores.status })
    .from(stores)
    .where(
      and(
        eq(stores.organizationId, organizationId),
        inArray(stores.id, uniqueStoreIds),
      ),
    );

  if (storeRows.length !== uniqueStoreIds.length) {
    throw catalogAppError(ERROR_CODES.INVALID_STORE_IDS);
  }

  if (storeRows.some((row) => row.status !== "active")) {
    throw new ValidationError("One or more selected stores are not active.");
  }

  return uniqueStoreIds;
}
