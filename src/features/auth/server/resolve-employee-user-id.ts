import { z } from "zod";

type StaffPerson = {
  id?: string;
  legacyId?: string;
  apiUserId?: string;
  nameAr?: string;
  nameEn?: string;
};

function isUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}

function normalizeEmployeeKey(value: string): string {
  return value.trim();
}

function readStaffList(runtimeSettings: Record<string, unknown> | null | undefined): StaffPerson[] {
  if (!runtimeSettings || !Array.isArray(runtimeSettings.staff)) return [];
  return runtimeSettings.staff.filter((entry): entry is StaffPerson => Boolean(entry && typeof entry === "object"));
}

export function findStaffPerson(staff: StaffPerson[], employeeId: string): StaffPerson | undefined {
  const normalized = normalizeEmployeeKey(employeeId);
  if (!normalized) return undefined;
  const lowered = normalized.toLowerCase();
  return staff.find((person) => {
    const id = typeof person.id === "string" ? normalizeEmployeeKey(person.id) : "";
    if (id === normalized || id.toLowerCase() === lowered) return true;
    const legacyId = typeof person.legacyId === "string" ? normalizeEmployeeKey(person.legacyId) : "";
    if (legacyId === normalized || legacyId.toLowerCase() === lowered) return true;
    const nameEn = typeof person.nameEn === "string" ? person.nameEn.trim().toLowerCase() : "";
    const nameAr = typeof person.nameAr === "string" ? person.nameAr.trim() : "";
    return nameEn === lowered || nameAr === normalized;
  });
}

export function collectStaffPersonNameCandidates(
  person: StaffPerson | undefined,
  employeeId = "",
): string[] {
  const names = new Set<string>();
  const normalizedEmployeeId = normalizeEmployeeKey(employeeId);
  if (normalizedEmployeeId) names.add(normalizedEmployeeId);
  if (!person) return [...names];

  const nameEn = typeof person.nameEn === "string" ? person.nameEn.trim() : "";
  const nameAr = typeof person.nameAr === "string" ? person.nameAr.trim() : "";
  if (nameEn) names.add(nameEn);
  if (nameAr) names.add(nameAr);
  return [...names];
}

function mappedUserIdFromMap(employeeId: string, userIdMap: Record<string, string>): string {
  const normalized = normalizeEmployeeKey(employeeId);
  if (!normalized) return "";
  const direct = userIdMap[normalized] || userIdMap[normalized.toLowerCase()];
  return typeof direct === "string" && isUuid(direct) ? direct : "";
}

export function resolveEmployeeUserId(
  employeeId: string,
  userIdMap: Record<string, string>,
  runtimeSettings: Record<string, unknown> | null | undefined,
): string {
  const normalized = normalizeEmployeeKey(employeeId);
  if (!normalized) return "";
  if (isUuid(normalized)) return normalized;

  const fromMap = mappedUserIdFromMap(normalized, userIdMap);
  if (fromMap) return fromMap;

  const staff = readStaffList(runtimeSettings);
  const person = findStaffPerson(staff, normalized);
  if (person) {
    if (typeof person.apiUserId === "string" && isUuid(person.apiUserId)) {
      return person.apiUserId;
    }
    const legacyId = typeof person.id === "string" ? normalizeEmployeeKey(person.id) : "";
    const explicitLegacyId = typeof person.legacyId === "string" ? normalizeEmployeeKey(person.legacyId) : "";
    const fromStaffLegacyMap = (explicitLegacyId ? mappedUserIdFromMap(explicitLegacyId, userIdMap) : "")
      || (legacyId ? mappedUserIdFromMap(legacyId, userIdMap) : "");
    if (fromStaffLegacyMap) return fromStaffLegacyMap;
  }

  return "";
}

export function enrichStaffWithApiUserIds(
  staff: unknown,
  userIdMap: Record<string, string>,
): unknown {
  if (!Array.isArray(staff)) return staff;
  return staff.map((entry) => {
    if (!entry || typeof entry !== "object") return entry;
    const person = { ...(entry as StaffPerson) };
    if (typeof person.apiUserId === "string" && isUuid(person.apiUserId)) {
      return person;
    }
    const legacyId = typeof person.id === "string" ? normalizeEmployeeKey(person.id) : "";
    const explicitLegacyId = typeof person.legacyId === "string" ? normalizeEmployeeKey(person.legacyId) : "";
    const mapped = (explicitLegacyId ? mappedUserIdFromMap(explicitLegacyId, userIdMap) : "")
      || (legacyId ? mappedUserIdFromMap(legacyId, userIdMap) : "");
    if (mapped) {
      person.apiUserId = mapped;
    }
    return person;
  });
}
