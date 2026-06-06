import { describe, expect, it } from "vitest";
import { buildRuntimeApiIdMaps } from "./runtime-api-id-maps";

describe("buildRuntimeApiIdMaps", () => {
  const envStoreIdMap = { shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c" };
  const envUserIdMap = { owner: "e8f3e35b-6051-4da3-8b10-979700c2f00f" };

  it("maps custom store id to sole seeded store uuid", () => {
    const maps = buildRuntimeApiIdMaps({
      configuredBusinesses: [{ id: "custom-1780679701214" }],
      envStoreIdMap,
      envUserIdMap,
    });
    expect(maps.storeIdMap["custom-1780679701214"]).toBe("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c");
  });

  it("maps runtime staff id to provisioned apiUserId", () => {
    const maps = buildRuntimeApiIdMaps({
      staff: [{ id: "staff-1", apiUserId: "acb24f1e-bf77-48d7-ba01-1e77d2c8c713" }],
      envStoreIdMap,
      envUserIdMap,
    });
    expect(maps.userIdMap["staff-1"]).toBe("acb24f1e-bf77-48d7-ba01-1e77d2c8c713");
  });
});
