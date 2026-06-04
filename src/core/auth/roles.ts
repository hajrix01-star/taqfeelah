export const MEMBER_ROLES = ["owner", "manager", "employee"] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

const roleWeight: Record<MemberRole, number> = {
  employee: 1,
  manager: 2,
  owner: 3,
};

export function hasAtLeastRole(currentRole: MemberRole, requiredRole: MemberRole): boolean {
  return roleWeight[currentRole] >= roleWeight[requiredRole];
}
