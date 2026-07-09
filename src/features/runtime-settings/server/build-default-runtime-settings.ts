import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { organizationMembers, users } from "@/core/db/schema";

export async function buildDefaultRuntimeSettingsForOrganization(organizationId: string) {
  const db = getDb();
  const [owner] = await db
    .select({
      name: users.name,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active"),
        eq(organizationMembers.role, "owner"),
      ),
    )
    .orderBy(asc(organizationMembers.createdAt))
    .limit(1);

  return {
    ownerProfile: {
      name: owner?.name?.trim() || "",
    },
    notebookTheme: "yellow",
    notebookPattern: "lined",
    employeePreferences: {},
    ownerShellPreferences: {},
    storeOperationalSettings: {},
    authConfig: {
      ownerUsername: "",
      ownerPassword: "",
      employeePins: {},
    },
  };
}
