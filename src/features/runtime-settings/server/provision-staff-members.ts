import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import {
  memberStoreAccess,
  organizationMembers,
  users,
} from "@/core/db/schema";
import {
  enrichStaffWithApiUserIds,
  resolveEmployeeUserId,
} from "@/features/auth/server/resolve-employee-user-id";

type StaffRecord = {
  id?: string;
  nameAr?: string;
  nameEn?: string;
  mobile?: string;
  active?: boolean;
  removed?: boolean;
  storeIds?: string[];
  apiUserId?: string;
  pin?: string;
};

function isUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}

function staffDisplayName(person: StaffRecord): string {
  const nameEn = typeof person.nameEn === "string" ? person.nameEn.trim() : "";
  const nameAr = typeof person.nameAr === "string" ? person.nameAr.trim() : "";
  return nameEn || nameAr || "Employee";
}

function resolveStoreUuid(storeId: string, storeIdMap: Record<string, string>): string {
  const normalized = storeId.trim();
  if (!normalized) return "";
  if (isUuid(normalized)) return normalized;
  const mapped = storeIdMap[normalized] || storeIdMap[normalized.toLowerCase()];
  return typeof mapped === "string" && isUuid(mapped) ? mapped : "";
}

async function ensureOrganizationMember(
  organizationId: string,
  userId: string,
): Promise<string> {
  const db = getDb();
  const existing = await db
    .select({ id: organizationMembers.id, role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId),
      ),
    )
    .limit(1);

  if (existing[0]?.id) {
    const existingRole = existing[0].role;
    if (existingRole === "owner" || existingRole === "manager") {
      await db
        .update(organizationMembers)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(organizationMembers.id, existing[0].id));
    } else {
      await db
        .update(organizationMembers)
        .set({ role: "employee", status: "active", updatedAt: new Date() })
        .where(eq(organizationMembers.id, existing[0].id));
    }
    return existing[0].id;
  }

  const memberId = randomUUID();
  await db.insert(organizationMembers).values({
    id: memberId,
    organizationId,
    userId,
    role: "employee",
    status: "active",
  });
  return memberId;
}

async function syncMemberStoreAccess(memberId: string, storeUuids: string[]) {
  const db = getDb();
  const uniqueStoreIds = [...new Set(storeUuids.filter(isUuid))];
  for (const storeId of uniqueStoreIds) {
    const existing = await db
      .select({ organizationMemberId: memberStoreAccess.organizationMemberId })
      .from(memberStoreAccess)
      .where(
        and(
          eq(memberStoreAccess.organizationMemberId, memberId),
          eq(memberStoreAccess.storeId, storeId),
        ),
      )
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(memberStoreAccess).values({
      organizationMemberId: memberId,
      storeId,
    });
  }
}

async function ensureStaffUser(
  organizationId: string,
  person: StaffRecord,
  userIdMap: Record<string, string>,
): Promise<string> {
  const db = getDb();
  const existingMapped = typeof person.apiUserId === "string" && isUuid(person.apiUserId)
    ? person.apiUserId
    : resolveEmployeeUserId(person.id || "", userIdMap, { staff: [person] });

  if (existingMapped) {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, existingMapped))
      .limit(1);
    if (existingUser) {
      await db
        .update(users)
        .set({ name: staffDisplayName(person), status: "active", updatedAt: new Date() })
        .where(eq(users.id, existingUser.id));
      return existingUser.id;
    }
    await db.insert(users).values({
      id: existingMapped,
      name: staffDisplayName(person),
      status: "active",
    });
    await ensureOrganizationMember(organizationId, existingMapped);
    return existingMapped;
  }

  const userId = randomUUID();
  await db.insert(users).values({
    id: userId,
    name: staffDisplayName(person),
    status: "active",
  });
  await ensureOrganizationMember(organizationId, userId);
  return userId;
}

export async function provisionStaffMembers(
  organizationId: string,
  staff: unknown,
  options: {
    storeIdMap: Record<string, string>;
    userIdMap: Record<string, string>;
  },
): Promise<StaffRecord[]> {
  if (!Array.isArray(staff)) return [];

  const enriched = enrichStaffWithApiUserIds(staff, options.userIdMap) as StaffRecord[];
  const provisioned: StaffRecord[] = [];

  for (const entry of enriched) {
    if (!entry || typeof entry !== "object") continue;
    const person: StaffRecord = { ...entry };

    if (person.removed || person.active === false) {
      provisioned.push(person);
      continue;
    }

    const userId = await ensureStaffUser(organizationId, person, options.userIdMap);
    person.apiUserId = userId;

    const memberId = await ensureOrganizationMember(organizationId, userId);
    const storeUuids = (person.storeIds || [])
      .map((storeId) => resolveStoreUuid(String(storeId), options.storeIdMap))
      .filter(Boolean);
    await syncMemberStoreAccess(memberId, storeUuids);

    provisioned.push(person);
  }

  return provisioned;
}

export function parseJsonMap(rawValue: string | undefined): Record<string, string> {
  if (!rawValue || typeof rawValue !== "string") return {};
  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}
