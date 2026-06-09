import { describe, expect, it } from "vitest";
import { DEFAULT_SALES_CHANNEL_UUIDS } from "@/core/client/sales-channel-catalog";
import { isUuid } from "@/features/closeouts/client/closeouts-api-client";
import {
  assertCanonicalUuidId,
  mapApiChannelToUi,
  mapApiStoreToBusiness,
  mapOrgConfigBundleToRuntime,
  validateOrgConfigDbChannelMappings,
} from "./org-config-runtime-mapper.js";

describe("org config runtime mapper", () => {
  it("maps store and channel api rows into runtime settings shape", () => {
    const mapped = mapOrgConfigBundleToRuntime({
      stores: [{
        id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        legacyId: "shami",
        name: "Shami",
        location: "Riyadh",
        status: "active",
        operationalSettings: {
          closeoutReviewEnabled: true,
          reviewEnabled: false,
          activeCategories: ["rent", "salary", "utility", "phone", "maintenance", "other"],
          employeeHistoryVisibility: "all",
          closeoutAlert: false,
          attachmentAlert: false,
          notebookTheme: null,
        },
      }],
      channelsByStoreId: {
        "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c": [{
          id: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
          legacyId: "cash",
          name: "Cash",
          status: "active",
        }],
      },
      members: [{
        memberId: "11111111-1111-4111-8111-111111111111",
        userId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
        legacyStaffId: "ahmed",
        name: "Ahmed",
        role: "employee",
        status: "active",
        storeAccess: [{ storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c", legacyStoreId: "shami" }],
      }],
    } as Parameters<typeof mapOrgConfigBundleToRuntime>[0]);

    expect(mapped.configuredBusinesses[0].id).toBe("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c");
    expect(mapped.configuredBusinesses[0].legacyId).toBe("shami");
    expect(mapped.configuredBusinesses[0].dbStoreId).toBe("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c");
    const channelSettings = mapped.storeChannelSettings as Record<string, { activeIds?: string[] }>;
    expect(channelSettings["302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c"]?.activeIds).toContain("9bc40d4f-c773-4ba3-87db-b8bb1467dafb");
    expect(mapped.staff[0].id).toBe("4cf1450d-08d8-4ca1-b180-1c2642174a79");
    expect(mapped.staff[0].legacyId).toBe("ahmed");
    expect(mapped.staff[0].storeIds).toEqual(["302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c"]);
    const operationalSettings = mapped.storeOperationalSettings as Record<string, { closeoutReviewEnabled?: boolean }>;
    expect(operationalSettings["302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c"]?.closeoutReviewEnabled).toBe(true);
  });

  it("maps unknown channels as custom entries", () => {
    const channel = mapApiChannelToUi({
      id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      name: "Talabat",
      status: "active",
    });
    expect(channel.custom).toBe(true);
    expect(channel.nameEn).toBe("Talabat");
  });

  it("rejects legacy ids as canonical DB ids", () => {
    expect(() => assertCanonicalUuidId("store", "shami")).toThrow("store id must be a canonical UUID");
    expect(() => mapApiStoreToBusiness({
      id: "shami",
      legacyId: "shami",
      name: "Shami",
    })).toThrow("store id must be a canonical UUID");
    expect(() => mapApiChannelToUi({
      id: "cash",
      legacyId: "cash",
      name: "Cash",
      status: "active",
    })).toThrow("sales channel id must be a canonical UUID");
  });

  it("rejects active channels without canonical apiChannelId in strict DB mode", () => {
    expect(() => validateOrgConfigDbChannelMappings({
      storeChannelSettings: {
        shami: {
          channels: [{ id: "cash", nameEn: "Cash" }],
          activeIds: ["cash"],
        },
      },
    }, { strict: true })).toThrow(/canonical UUID in DB source mode/i);
  });

  it("catalog channel UUIDs pass canonical DB id validation", () => {
    for (const [legacyId, uuid] of Object.entries(DEFAULT_SALES_CHANNEL_UUIDS)) {
      expect(isUuid(uuid), `${legacyId} must be a canonical UUID`).toBe(true);
    }
  });

  it("maps archived stores into archived ids", () => {
    const business = mapApiStoreToBusiness({
      id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      legacyId: "shami",
      name: "Shami",
      status: "archived",
    });
    expect(business.id).toBe("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c");
    expect(business.legacyId).toBe("shami");
    expect(business.dbStoreId).toBe("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c");
  });
});
