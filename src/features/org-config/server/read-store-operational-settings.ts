import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { stores } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { normalizeStoreOperationalSettings } from "@/domain/store-operational-settings/normalize";
import type { StoreOperationalSettings } from "@/domain/store-operational-settings/types";

type DbClient = Pick<NodePgDatabase<Record<string, never>>, "select">;

export async function readStoreOperationalSettingsRecord(
  db: DbClient,
  organizationId: string,
  storeId: string,
): Promise<StoreOperationalSettings> {
  const [row] = await db
    .select({ operationalSettings: stores.operationalSettings })
    .from(stores)
    .where(
      and(
        eq(stores.id, storeId),
        eq(stores.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new ValidationError("Store was not found for this organization.");
  }

  return normalizeStoreOperationalSettings(row.operationalSettings);
}
