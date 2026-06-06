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

    const { persistOrgConfigSnapshot } = await import("./org-config-runtime-sync.js");
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

    const { persistOrgConfigSnapshot } = await import("./org-config-runtime-sync.js");
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
          shami: { closeoutReviewEnabled: false },
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
          shami: { closeoutReviewEnabled: true },
        },
        staff: [],
      },
    });

    const patchCall = fetchMock.mock.calls.find(([url, init]) => (
      String(url).includes("/operational-settings") && init?.method === "PATCH"
    ));
    expect(patchCall).toBeTruthy();
    expect(JSON.parse(String(patchCall?.[1]?.body))).toMatchObject({
      closeoutReviewEnabled: true,
    });
  });
});
