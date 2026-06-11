import { describe, expect, it } from "vitest";
import { mergeCanonicalOwnerProfileIntoSettings } from "./sync-runtime-owner-profile";

describe("mergeCanonicalOwnerProfileIntoSettings", () => {
  it("overrides stale owner profile names with the canonical database owner name", () => {
    const merged = mergeCanonicalOwnerProfileIntoSettings(
      {
        ownerProfile: { name: "محمد الهاجري" },
        notebookTheme: "yellow",
      },
      "Tenant Owner",
    );

    expect(merged).toEqual({
      ownerProfile: { name: "Tenant Owner" },
      notebookTheme: "yellow",
    });
  });

  it("returns null when there are no settings and no canonical owner name", () => {
    expect(mergeCanonicalOwnerProfileIntoSettings(null, "")).toBeNull();
  });

  it("keeps settings unchanged when the owner profile already matches", () => {
    const settings = { ownerProfile: { name: "Tenant Owner" } };
    expect(mergeCanonicalOwnerProfileIntoSettings(settings, "Tenant Owner")).toBe(settings);
  });
});
