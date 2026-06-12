import { describe, expect, it } from "vitest";
import {
  platformAdminCan,
  type PlatformAdminPermission,
} from "@/features/saas-admin/server/platform-admin-roles";

describe("platform admin roles", () => {
  it("grants owner full permissions", () => {
    const permissions: PlatformAdminPermission[] = [
      "accounts:write",
      "plans:write",
      "platform-admins:write",
      "investor-metrics:read",
      "analytics:aggregate",
    ];
    for (const permission of permissions) {
      expect(platformAdminCan("owner", permission)).toBe(true);
    }
  });

  it("limits support to operational read/support actions", () => {
    expect(platformAdminCan("support", "accounts:read")).toBe(true);
    expect(platformAdminCan("support", "accounts:setup-link")).toBe(true);
    expect(platformAdminCan("support", "accounts:repair")).toBe(true);
    expect(platformAdminCan("support", "usage:read")).toBe(true);
    expect(platformAdminCan("support", "accounts:write")).toBe(false);
    expect(platformAdminCan("support", "plans:read")).toBe(false);
    expect(platformAdminCan("support", "platform-admins:read")).toBe(false);
    expect(platformAdminCan("support", "investor-metrics:read")).toBe(false);
    expect(platformAdminCan("support", "analytics:aggregate")).toBe(false);
  });
});
