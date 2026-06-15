import { and, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { hasAtLeastRole, type MemberRole } from "@/core/auth/roles";
import { ForbiddenError } from "@/core/errors/app-error";
import { memberStoreAccess, organizationMembers, stores } from "@/core/db/schema";

export type StoreAccessScope = "read" | "write";

type AssertStoreAccessInput = {
  organizationId: string;
  storeId: string;
  actorUserId: string;
  actorRole: MemberRole;
  minimumRole?: MemberRole;
  /** write = active stores only (default). read = active + archived history. */
  scope?: StoreAccessScope;
};

export async function assertStoreAccess(input: AssertStoreAccessInput) {
  const db = getDb();
  const minimumRole = input.minimumRole || "employee";
  const scope = input.scope ?? "write";

  const [storeRow] = await db
    .select({ id: stores.id, status: stores.status })
    .from(stores)
    .where(
      and(
        eq(stores.id, input.storeId),
        eq(stores.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  if (!storeRow) {
    throw new ForbiddenError("Store is not accessible for this organization.");
  }

  if (scope === "write") {
    if (storeRow.status !== "active") {
      throw new ForbiddenError(
        storeRow.status === "archived"
          ? "Archived stores cannot accept new entries."
          : "Store is not accessible for this organization.",
      );
    }
  } else if (storeRow.status !== "active" && storeRow.status !== "archived") {
    throw new ForbiddenError("Store is not accessible for this organization.");
  }

  const [membership] = await db
    .select({ id: organizationMembers.id, role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, input.organizationId),
        eq(organizationMembers.userId, input.actorUserId),
        eq(organizationMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new ForbiddenError("User is not an active member of this organization.");
  }

  const memberRole = membership.role as MemberRole;
  if (!hasAtLeastRole(memberRole, input.actorRole)) {
    throw new ForbiddenError("Provided role does not match membership privileges.");
  }

  if (!hasAtLeastRole(memberRole, minimumRole)) {
    throw new ForbiddenError("Insufficient role for this operation.");
  }

  if (storeRow.status === "archived" && memberRole === "employee") {
    throw new ForbiddenError("Employee has no access to this store.");
  }

  if (memberRole === "employee") {
    const [storePermission] = await db
      .select({ storeId: memberStoreAccess.storeId })
      .from(memberStoreAccess)
      .where(
        and(
          eq(memberStoreAccess.organizationMemberId, membership.id),
          eq(memberStoreAccess.storeId, input.storeId),
        ),
      )
      .limit(1);

    if (!storePermission) {
      throw new ForbiddenError("Employee has no access to this store.");
    }
  }
}
