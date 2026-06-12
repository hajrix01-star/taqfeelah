import { and, eq } from "drizzle-orm";
import type { getDb } from "@/core/db/client";
import { organizations, stores } from "@/core/db/schema";
import { ERROR_CODES } from "@/core/errors/error-codes";
import { catalogAppError } from "@/core/errors/normalize-error";

type DbClient = ReturnType<typeof getDb>;
type DbExecutor = Pick<DbClient, "select">;

export async function assertSaasOrganizationExists(
  db: DbExecutor,
  organizationId: string,
): Promise<void> {
  const [organization] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!organization?.id) {
    throw catalogAppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
  }
}

export async function assertSaasStoreBelongsToOrg(
  db: DbExecutor,
  organizationId: string,
  storeId: string,
): Promise<{ id: string; status: string }> {
  await assertSaasOrganizationExists(db, organizationId);

  const [store] = await db
    .select({
      id: stores.id,
      status: stores.status,
    })
    .from(stores)
    .where(
      and(
        eq(stores.id, storeId),
        eq(stores.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!store?.id) {
    throw catalogAppError(ERROR_CODES.STORE_NOT_FOUND);
  }

  return store;
}
