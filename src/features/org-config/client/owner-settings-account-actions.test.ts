import { describe, expect, it } from "vitest";
import {
  buildOwnerProfileUpdate,
  isOwnerAuthDirty,
  isOwnerProfileDirty,
  validateOwnerAuthCredentials,
} from "./owner-settings-account-actions";

describe("owner settings account actions", () => {
  it("validates owner auth credentials", () => {
    expect(validateOwnerAuthCredentials(" owner ", " pass ")).toEqual({
      valid: true,
      username: "owner",
      password: "pass",
    });
    expect(validateOwnerAuthCredentials("", "pass").valid).toBe(false);
  });

  it("builds owner profile update when name is present", () => {
    expect(buildOwnerProfileUpdate({ name: "Old" }, " New ")).toEqual({ name: "New" });
    expect(buildOwnerProfileUpdate({ name: "Old" }, "   ")).toBeNull();
  });

  it("detects dirty profile and auth drafts", () => {
    expect(isOwnerProfileDirty("New", "Old")).toBe(true);
    expect(isOwnerProfileDirty("Old", "Old")).toBe(false);
    expect(isOwnerAuthDirty({
      draftUsername: "owner2",
      draftPassword: "demo",
      currentUsername: "owner",
      currentPassword: "demo",
    })).toBe(true);
  });
});
