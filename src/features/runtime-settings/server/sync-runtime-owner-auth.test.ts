import { describe, expect, it } from "vitest";
import {
  mergeCanonicalOwnerAuthIntoSettings,
  resolveOrganizationOwnerAuth,
} from "@/features/runtime-settings/server/sync-runtime-owner-auth";

describe("mergeCanonicalOwnerAuthIntoSettings", () => {
  it("merges email and login phone into authConfig and ownerContact", () => {
    const merged = mergeCanonicalOwnerAuthIntoSettings(
      { authConfig: { ownerUsername: "hajri", ownerPassword: "123" } },
      {
        ownerUsername: "owner@example.com",
        ownerLoginPhone: "+966501234567",
        ownerEmail: "owner@example.com",
      },
    );

    expect(merged?.authConfig).toEqual({
      ownerUsername: "owner@example.com",
      ownerLoginPhone: "+966501234567",
      ownerPassword: "",
    });
    expect(merged?.ownerContact).toEqual({
      email: "owner@example.com",
      loginPhone: "+966501234567",
    });
  });

  it("returns settings unchanged when canonical auth is missing", () => {
    const settings = { ownerProfile: { name: "Owner" } };
    expect(mergeCanonicalOwnerAuthIntoSettings(settings, null)).toEqual(settings);
  });
});

describe("resolveOrganizationOwnerAuth", () => {
  it("exports a resolver function", () => {
    expect(typeof resolveOrganizationOwnerAuth).toBe("function");
  });
});
