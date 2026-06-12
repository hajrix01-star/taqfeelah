import { describe, expect, it } from "vitest";
import { resolveEffectiveInvitationStatus } from "@/features/member-invitations/server/resolve-invitation-status";

describe("resolveEffectiveInvitationStatus", () => {
  const now = new Date("2026-06-12T12:00:00.000Z");

  it("returns revoked when revokedAt is set", () => {
    expect(resolveEffectiveInvitationStatus({
      status: "pending",
      expiresAt: new Date("2026-06-13T12:00:00.000Z"),
      lockedAt: null,
      usedAt: null,
      revokedAt: now,
    }, now)).toBe("revoked");
  });

  it("returns expired for pending invitations past expiry", () => {
    expect(resolveEffectiveInvitationStatus({
      status: "pending",
      expiresAt: new Date("2026-06-11T12:00:00.000Z"),
      lockedAt: null,
      usedAt: null,
      revokedAt: null,
    }, now)).toBe("expired");
  });

  it("returns locked when lockedAt is set", () => {
    expect(resolveEffectiveInvitationStatus({
      status: "locked",
      expiresAt: new Date("2026-06-13T12:00:00.000Z"),
      lockedAt: now,
      usedAt: null,
      revokedAt: null,
    }, now)).toBe("locked");
  });
});
