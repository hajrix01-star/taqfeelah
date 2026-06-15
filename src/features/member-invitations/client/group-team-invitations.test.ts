import { describe, expect, it } from "vitest";
import {
  groupTeamInvitations,
  resolveStaffInviteUserKey,
} from "./group-team-invitations";

describe("groupTeamInvitations", () => {
  it("separates pending invites from used invites grouped by accepted user", () => {
    const grouped = groupTeamInvitations([
      {
        invitationId: "pending-1",
        status: "pending",
        displayName: "Pending Employee",
        createdAt: "2026-06-15T10:00:00.000Z",
      },
      {
        invitationId: "used-old",
        status: "used",
        acceptedUserId: "user-1",
        displayName: "Mohammed",
        createdAt: "2026-06-10T10:00:00.000Z",
      },
      {
        invitationId: "used-new",
        status: "used",
        acceptedUserId: "user-1",
        displayName: "Mohammed Updated",
        createdAt: "2026-06-15T10:00:00.000Z",
      },
      {
        invitationId: "expired-1",
        status: "expired",
        displayName: "Expired",
        createdAt: "2026-06-01T10:00:00.000Z",
      },
    ]);

    expect(grouped.pendingInvites).toHaveLength(1);
    expect(grouped.pendingInvites[0]?.invitationId).toBe("pending-1");
    expect(grouped.usedInvitesByUserId.get("user-1")?.invitationId).toBe("used-new");
  });
});

describe("resolveStaffInviteUserKey", () => {
  it("prefers apiUserId over legacy staff id", () => {
    expect(resolveStaffInviteUserKey({
      id: "legacy-staff",
      apiUserId: "uuid-user",
    })).toBe("uuid-user");
  });
});
