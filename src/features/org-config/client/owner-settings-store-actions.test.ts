import { describe, expect, it } from "vitest";
import {
  applyPersistedStoreChannelSettings,
  applyStoreProfileUpdate,
  buildArchiveStoreDeleteTarget,
  buildNewConfiguredBusiness,
  buildRemoveStoreDeleteTarget,
  partitionConfiguredBusinesses,
  toggleArchivedBusinessId,
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

  it("partitions stores and builds delete targets", () => {
    const partitioned = partitionConfiguredBusinesses(
      [{ id: "shami" }, { id: "arz" }],
      ["arz"],
    );
    expect(partitioned.active.map((store) => store.id)).toEqual(["shami"]);
    expect(partitioned.archived.map((store) => store.id)).toEqual(["arz"]);
    expect(toggleArchivedBusinessId(["arz"], "shami")).toEqual(["arz", "shami"]);
    expect(buildArchiveStoreDeleteTarget({ id: "shami" }, [{ id: "ahmed" }])).toEqual({
      type: "archive",
      item: { id: "shami" },
      affectedStaff: [{ id: "ahmed" }],
    });
    expect(buildRemoveStoreDeleteTarget({ id: "shami" }, { hasRecords: false }).type).toBe("store");
    expect(applyPersistedStoreChannelSettings({}, "shami", { channels: [], activeIds: ["cash"] }).shami)
      .toEqual({ channels: [], activeIds: ["cash"] });
  });
});
