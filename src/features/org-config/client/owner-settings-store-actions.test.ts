import { describe, expect, it } from "vitest";
import {
  applyStoreProfileUpdate,
  buildNewConfiguredBusiness,
} from "./owner-settings-store-actions";

const emptyStoreRecord = {
  sales: 0,
  expense: 0,
  ratio: "0.0%",
  net: 0,
  proofs: 0,
  pending: 0,
};

describe("owner settings store actions", () => {
  it("builds a configured business when name is provided", () => {
    const business = buildNewConfiguredBusiness({
      id: "custom-test",
      name: " Branch ",
      location: "Riyadh",
      emptyStoreRecord,
    });

    expect(business).toEqual({
      id: "custom-test",
      nameAr: "Branch",
      nameEn: "Branch",
      customLocation: "Riyadh",
      day: emptyStoreRecord,
      month: emptyStoreRecord,
    });
  });

  it("applies store profile updates", () => {
    const next = applyStoreProfileUpdate(
      [{ id: "shami", displayName: "Old" }],
      "shami",
      { name: " New Name ", location: " Jeddah " },
    );

    expect(next[0]).toMatchObject({
      displayName: "New Name",
      customLocation: "Jeddah",
    });
  });
});
