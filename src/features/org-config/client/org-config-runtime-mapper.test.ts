import { describe, expect, it } from "vitest";
import { DEFAULT_SALES_CHANNEL_UUIDS } from "@/core/client/sales-channel-catalog";
import { isUuid } from "@/features/closeouts/client/closeouts-api-client";
import {
  assertCanonicalUuidId,
  buildOrgConfigPersistBaseline,
  isClientGeneratedId,
  mapApiChannelToUi,
  mapApiMemberToStaff,
  mapApiStoreToBusiness,
  mapOrgConfigBundleToRuntime,
  validateOrgConfigDbChannelMappings,
} from "./org-config-runtime-mapper";

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
    expect(mapped.staff[0].pin).toBe("");
  });

  it("does not fabricate pins when auth identity is configured", () => {
    const staff = mapApiMemberToStaff({
      memberId: "11111111-1111-4111-8111-111111111111",
      userId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
      name: "Ahmed",
      role: "employee",
      status: "active",
      pinConfigured: true,
      storeAccess: [],
    });

    expect(staff.pin).toBe("");
    expect(staff.pinConfigured).toBe(true);
  });

  it("uses draft pin overrides for configured employees", () => {
    const staff = mapApiMemberToStaff({
      memberId: "11111111-1111-4111-8111-111111111111",
      userId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
      name: "Ahmed",
      role: "employee",
      status: "active",
      pinConfigured: true,
      storeAccess: [],
    }, { employeePins: { "4cf1450d-08d8-4ca1-b180-1c2642174a79": "9876" } });

    expect(staff.pin).toBe("9876");
  });

  it("keeps inactive employees visible so owners can reactivate them", () => {
    const staff = mapApiMemberToStaff({
      memberId: "11111111-1111-4111-8111-111111111111",
      userId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
      name: "Sara",
      role: "employee",
      status: "inactive",
      storeAccess: [],
    });

    expect(staff.active).toBe(false);
    expect(staff.removed).toBe(false);
    expect(staff.status).toBe("inactive");
  });

  it("maps store operational settings from API rows", () => {
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

    const operationalSettings = mapped.storeOperationalSettings as Record<string, { closeoutAlert?: boolean }>;
    expect(operationalSettings["302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c"]?.closeoutAlert).toBe(false);
  });

  it("maps unknown channels as custom entries", () => {
    const channel = mapApiChannelToUi({
      id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      name: "Talabat",
      kind: "sales_channel",
      status: "active",
    });
    expect(channel.custom).toBe(true);
    expect(channel.kind).toBe("sales_channel");
    expect(channel.nameEn).toBe("Talabat");
  });

  it("filters deleted sales channels from runtime channel settings", () => {
    const mapped = mapOrgConfigBundleToRuntime({
      stores: [{
        id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        legacyId: "shami",
        name: "Shami",
        status: "active",
      }],
      channelsByStoreId: {
        "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c": [{
          id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          name: "Delivery",
          status: "retired",
          deletedAt: "2026-06-24T00:00:00.000Z",
        }],
      },
      members: [],
    });

    expect(mapped.storeChannelSettings["302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c"].channels).toEqual([]);
  });

  it("maps production sales channel API rows with RFC4122 UUID ids", () => {
    const productionChannels = [
      { id: "8d4b2f3a-9c5e-4f0b-b2d3-4e5f6a7b8c9d", legacyId: "apple", name: "Apple Pay", status: "active" },
      { id: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb", legacyId: "cash", name: "Cash", status: "active" },
      { id: "9e5c3a4b-0d6f-4a1c-a3e4-5f6a7b8c9d0e", legacyId: "jahez", name: "Jahez", status: "active" },
      { id: "af6d4b5c-1e7a-4b2d-a4f5-6a7b8c9d0e1f", legacyId: "hunger", name: "HungerStation", status: "active" },
    ];

    const mapped = mapOrgConfigBundleToRuntime({
      stores: [{
        id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        legacyId: "shami",
        name: "Shami",
        status: "active",
      }],
      channelsByStoreId: {
        "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c": productionChannels,
      },
      members: [],
    } as Parameters<typeof mapOrgConfigBundleToRuntime>[0]);

    expect(() => validateOrgConfigDbChannelMappings(mapped, { strict: true })).not.toThrow();
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

  it("recognizes pending client-generated ids", () => {
    expect(isClientGeneratedId("custom-1718040000000")).toBe(true);
    expect(isClientGeneratedId("staff-1718040000000")).toBe(true);
    expect(isClientGeneratedId("channel-1718040000000")).toBe(true);
    expect(isClientGeneratedId("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c")).toBe(false);
  });

  it("builds persist baseline for pending stores before API create resolves ids", () => {
    expect(() => buildOrgConfigPersistBaseline({
      configuredBusinesses: [{
        id: "custom-1718040000000",
        nameAr: "New Branch",
        nameEn: "New Branch",
        customLocation: "Riyadh",
      }],
      archivedBusinessIds: [],
      storeChannelSettings: {
        "custom-1718040000000": { channels: [], activeIds: [] },
      },
      storeOperationalSettings: {},
      staff: [{
        id: "staff-1718040000000",
        nameAr: "Sara",
        nameEn: "Sara",
        storeIds: ["custom-1718040000000"],
        active: true,
        removed: false,
      }],
    })).not.toThrow();
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
