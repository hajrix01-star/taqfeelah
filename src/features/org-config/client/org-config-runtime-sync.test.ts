import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function setMapsEnv() {
  process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP = JSON.stringify({
    shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  });
  process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP = JSON.stringify({
    owner: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
  });
  process.env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP = JSON.stringify({
    cash: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
  });
}

describe("org config runtime sync", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    setMapsEnv();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("persists store profile updates through store patch api", async () => {
    const fetchMock = vi.fn(async (url, init) => {
      if (String(url).includes("/api/v1/stores/302cf87a") && init?.method === "PATCH") {
        return new Response(JSON.stringify({
          id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
          name: "New Name",
          location: "Jeddah",
          status: "active",
        }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { persistOrgConfigSnapshot } = await import("./org-config-runtime-sync");
    await persistOrgConfigSnapshot({
      auth: {
        organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
        actorUserId: "owner",
        actorRole: "owner",
      },
      baseline: {
        configuredBusinesses: [{
          id: "shami",
          dbStoreId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
          displayName: "Old Name",
          customLocation: "Riyadh",
        }],
        archivedBusinessIds: [],
        storeChannelSettings: {},
        staff: [],
      },
      next: {
        configuredBusinesses: [{
          id: "shami",
          dbStoreId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
          displayName: "New Name",
          customLocation: "Jeddah",
        }],
        archivedBusinessIds: [],
        storeChannelSettings: {},
        staff: [],
      },
    });

    expect(fetchMock).toHaveBeenCalled();
    const patchCall = fetchMock.mock.calls.find(([url, init]) => String(url).includes("/api/v1/stores/302cf87a") && init?.method === "PATCH");
    expect(patchCall).toBeTruthy();
    expect(JSON.parse(String(patchCall?.[1]?.body))).toMatchObject({
      name: "New Name",
      location: "Jeddah",
    });
  });

  it("creates pending staff members through members api", async () => {
    const fetchMock = vi.fn(async (url, init) => {
      if (String(url).endsWith("/api/v1/members") && init?.method === "POST") {
        return new Response(JSON.stringify({
          member: {
            memberId: "11111111-1111-4111-8111-111111111111",
            userId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
            name: "Sara",
            role: "employee",
            status: "active",
            storeIds: ["302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c"],
          },
        }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { persistOrgConfigSnapshot } = await import("./org-config-runtime-sync");
    const applied = await persistOrgConfigSnapshot({
      auth: {
        organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
        actorUserId: "owner",
        actorRole: "owner",
      },
      baseline: {
        configuredBusinesses: [],
        archivedBusinessIds: [],
        storeChannelSettings: {},
        staff: [],
      },
      next: {
        configuredBusinesses: [],
        archivedBusinessIds: [],
        storeChannelSettings: {},
        staff: [{
          id: "staff-1718040000000",
          nameAr: "Sara",
          nameEn: "Sara",
          mobile: "0500000000",
          active: true,
          storeIds: ["shami"],
        }],
      },
      employeePins: { "staff-1718040000000": "4321" },
    });

    expect(fetchMock).toHaveBeenCalled();
    const createCall = fetchMock.mock.calls.find(([url, init]) => (
      String(url).endsWith("/api/v1/members") && init?.method === "POST"
    ));
    expect(createCall).toBeTruthy();
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      name: "Sara",
      credentials: { type: "employee_pin", pin: "4321" },
    });
    expect(applied.staff[0]?.id).toBe("4cf1450d-08d8-4ca1-b180-1c2642174a79");
  });

  it("persists store operational settings through dedicated patch api", async () => {
    const fetchMock = vi.fn(async (url, init) => {
      if (String(url).includes("/operational-settings") && init?.method === "PATCH") {
        return new Response(JSON.stringify({
          storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
          operationalSettings: {
            closeoutReviewEnabled: true,
            reviewEnabled: false,
            activeCategories: ["rent", "salary", "utility", "phone", "maintenance", "other"],
            employeeHistoryVisibility: "all",
            closeoutAlert: false,
            attachmentAlert: false,
            notebookTheme: null,
          },
        }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { persistOrgConfigSnapshot } = await import("./org-config-runtime-sync");
    await persistOrgConfigSnapshot({
      auth: {
        organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
        actorUserId: "owner",
        actorRole: "owner",
      },
      baseline: {
        configuredBusinesses: [{
          id: "shami",
          dbStoreId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        }],
        archivedBusinessIds: [],
        storeChannelSettings: {},
        storeOperationalSettings: {
          shami: { closeoutAlert: false },
        },
        staff: [],
      },
      next: {
        configuredBusinesses: [{
          id: "shami",
          dbStoreId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        }],
        archivedBusinessIds: [],
        storeChannelSettings: {},
        storeOperationalSettings: {
          shami: { closeoutAlert: true },
        },
        staff: [],
      },
    });

    const patchCall = fetchMock.mock.calls.find(([url, init]) => (
      String(url).includes("/operational-settings") && init?.method === "PATCH"
    ));
    expect(patchCall).toBeTruthy();
    expect(JSON.parse(String(patchCall?.[1]?.body))).toMatchObject({
      closeoutAlert: true,
    });
  });

  it("creates custom sales channels through sales channels post api", async () => {
    const createdChannelId = "22222222-2222-4222-8222-222222222222";
    const fetchMock = vi.fn(async (url, init) => {
      if (String(url).includes("/sales-channels") && init?.method === "POST") {
        return new Response(JSON.stringify({
          channel: {
            id: createdChannelId,
            name: "Delivery",
            status: "active",
            retiredAt: null,
            createdAt: "2026-06-12T00:00:00.000Z",
          },
        }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { persistOrgConfigSnapshot } = await import("./org-config-runtime-sync");
    const applied = await persistOrgConfigSnapshot({
      auth: {
        organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
        actorUserId: "owner",
        actorRole: "owner",
      },
      baseline: {
        configuredBusinesses: [{
          id: "shami",
          dbStoreId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        }],
        archivedBusinessIds: [],
        storeChannelSettings: {
          shami: {
            channels: [{
              id: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
              apiChannelId: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
              nameAr: "Cash",
              nameEn: "Cash",
            }],
            activeIds: ["9bc40d4f-c773-4ba3-87db-b8bb1467dafb"],
          },
        },
        staff: [],
      },
      next: {
        configuredBusinesses: [{
          id: "shami",
          dbStoreId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        }],
        archivedBusinessIds: [],
        storeChannelSettings: {
          shami: {
            channels: [
              {
                id: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
                apiChannelId: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
                nameAr: "Cash",
                nameEn: "Cash",
              },
              {
                id: "channel-1718040000000",
                custom: true,
                nameAr: "Delivery",
                nameEn: "Delivery",
              },
            ],
            activeIds: [
              "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
              "channel-1718040000000",
            ],
          },
        },
        staff: [],
      },
    });

    const createCall = fetchMock.mock.calls.find(([url, init]) => (
      String(url).includes("/sales-channels") && init?.method === "POST"
    ));
    expect(createCall).toBeTruthy();
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      name: "Delivery",
      kind: "payment_method",
      status: "active",
      reason: "owner_added_channel",
    });
    const remapped = applied.storeChannelSettings.shami;
    expect(remapped.channels.some((channel) => channel.id === createdChannelId)).toBe(true);
    expect(remapped.activeIds).toContain(createdChannelId);
    expect(remapped.activeIds).not.toContain("channel-1718040000000");
  });

  it("creates catalog sales channels even when only legacy preset metadata is present", async () => {
    const createdChannelId = "33333333-3333-4333-8333-333333333333";
    const fetchMock = vi.fn(async (url, init) => {
      if (String(url).includes("/sales-channels") && init?.method === "POST") {
        return new Response(JSON.stringify({
          channel: {
            id: createdChannelId,
            name: "Keeta",
            kind: "sales_channel",
            status: "active",
            retiredAt: null,
            createdAt: "2026-06-12T00:00:00.000Z",
          },
        }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { persistOrgConfigSnapshot } = await import("./org-config-runtime-sync");
    const applied = await persistOrgConfigSnapshot({
      auth: {
        organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
        actorUserId: "owner",
        actorRole: "owner",
      },
      baseline: {
        configuredBusinesses: [{
          id: "shami",
          dbStoreId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        }],
        archivedBusinessIds: [],
        storeChannelSettings: {
          shami: {
            channels: [{
              id: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
              apiChannelId: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
              nameAr: "Cash",
              nameEn: "Cash",
            }],
            activeIds: ["9bc40d4f-c773-4ba3-87db-b8bb1467dafb"],
          },
        },
        staff: [],
      },
      next: {
        configuredBusinesses: [{
          id: "shami",
          dbStoreId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        }],
        archivedBusinessIds: [],
        storeChannelSettings: {
          shami: {
            channels: [
              {
                id: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
                apiChannelId: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
                nameAr: "Cash",
                nameEn: "Cash",
              },
              {
                id: "keeta",
                legacyId: "keeta",
                text: "keeta",
                kind: "sales_channel",
              },
            ],
            activeIds: [
              "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
              "keeta",
            ],
          },
        },
        staff: [],
      },
    });

    const createCall = fetchMock.mock.calls.find(([url, init]) => (
      String(url).includes("/sales-channels") && init?.method === "POST"
    ));
    expect(createCall).toBeTruthy();
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      name: "كيتا",
      kind: "sales_channel",
      status: "active",
    });
    expect(applied.storeChannelSettings.shami.activeIds).toContain(createdChannelId);
  });

  it("reuses existing catalog api channel instead of creating a duplicate", async () => {
    const existingCashId = "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    const { persistOrgConfigSnapshot } = await import("./org-config-runtime-sync");
    const applied = await persistOrgConfigSnapshot({
      auth: {
        organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
        actorUserId: "owner",
        actorRole: "owner",
      },
      baseline: {
        configuredBusinesses: [{
          id: "shami",
          dbStoreId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        }],
        archivedBusinessIds: [],
        storeChannelSettings: {
          shami: {
            channels: [{
              id: existingCashId,
              apiChannelId: existingCashId,
              legacyId: "cash",
              text: "cash",
              nameAr: "نقد",
              nameEn: "Cash",
            }],
            activeIds: [existingCashId],
          },
        },
        staff: [],
      },
      next: {
        configuredBusinesses: [{
          id: "shami",
          dbStoreId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        }],
        archivedBusinessIds: [],
        storeChannelSettings: {
          shami: {
            channels: [
              {
                id: existingCashId,
                apiChannelId: existingCashId,
                legacyId: "cash",
                text: "cash",
                nameAr: "نقد",
                nameEn: "Cash",
              },
              {
                id: "cash",
                legacyId: "cash",
                text: "cash",
                kind: "payment_method",
                nameAr: "نقد",
                nameEn: "Cash",
              },
            ],
            activeIds: [existingCashId, "cash"],
          },
        },
        staff: [],
      },
    });

    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/sales-channels"),
      expect.objectContaining({ method: "POST" }),
    );

    const shamiChannels = applied.storeChannelSettings.shami;
    expect(shamiChannels.activeIds).toEqual([existingCashId]);
    expect(shamiChannels.channels.filter((channel) => channel.id === existingCashId)).toHaveLength(1);
  });
});
