import { describe, expect, it } from "vitest";
import { formatStaffInviteActivationLine } from "./format-staff-invite-activation-line";

describe("formatStaffInviteActivationLine", () => {
  it("includes invite alias when it differs from current member name", () => {
    const line = formatStaffInviteActivationLine({
      invite: {
        displayName: "محمد الهاجري",
        invitationDisplayName: "G",
        storeName: "النجاح",
      },
      labels: {
        activatedViaInvite: "مفعّل عبر دعوة",
        inviteAlias: "دعوة باسم",
      },
    });

    expect(line).toBe("مفعّل عبر دعوة (G) · النجاح");
  });

  it("returns empty string when invite is missing", () => {
    expect(formatStaffInviteActivationLine({
      invite: null,
      labels: {
        activatedViaInvite: "Activated via invite",
        inviteAlias: "Invited as",
      },
    })).toBe("");
  });
});
