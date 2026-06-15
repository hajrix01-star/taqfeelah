import { describe, expect, it } from "vitest";
import { resolveInvitationListDisplayName } from "./resolve-invitation-list-display-name";

describe("resolveInvitationListDisplayName", () => {
  it("uses accepted member name for used invitations", () => {
    const result = resolveInvitationListDisplayName({
      invitationDisplayName: "G",
      acceptedMemberName: "محمد الهاجري",
      status: "used",
    });

    expect(result.displayName).toBe("محمد الهاجري");
    expect(result.invitationDisplayName).toBe("G");
  });

  it("keeps invitation display name for pending invitations", () => {
    const result = resolveInvitationListDisplayName({
      invitationDisplayName: "G",
      acceptedMemberName: "محمد الهاجري",
      status: "pending",
    });

    expect(result.displayName).toBe("G");
  });

  it("falls back to invitation display name when member name is missing", () => {
    const result = resolveInvitationListDisplayName({
      invitationDisplayName: "H",
      acceptedMemberName: "",
      status: "used",
    });

    expect(result.displayName).toBe("H");
  });
});
