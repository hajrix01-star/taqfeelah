import { describe, expect, it } from "vitest";
import {
  mapApiChannelToUi,
  mapApiStoreToBusiness,
  mapOrgConfigBundleToRuntime,
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

    expect(mapped.configuredBusinesses[0].id).toBe("shami");
    expect(mapped.configuredBusinesses[0].dbStoreId).toBe("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c");
    const channelSettings = mapped.storeChannelSettings as Record<string, { activeIds?: string[] }>;
    expect(channelSettings.shami?.activeIds).toContain("cash");
    expect(mapped.staff[0].id).toBe("ahmed");
    expect(mapped.staff[0].storeIds).toEqual(["shami"]);
    const operationalSettings = mapped.storeOperationalSettings as Record<string, { closeoutReviewEnabled?: boolean }>;
    expect(operationalSettings.shami?.closeoutReviewEnabled).toBe(true);
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

  it("maps archived stores into archived ids", () => {
    const business = mapApiStoreToBusiness({
      id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      legacyId: "shami",
      name: "Shami",
      status: "archived",
    });
    expect(business.id).toBe("shami");
    expect(business.dbStoreId).toBe("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c");
  });
});
