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

describe("org config api client", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("fetches stores and remaps ids to runtime keys", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({
        stores: [{
          id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
          name: "Shami",
          location: "",
          status: "active",
        }],
      }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchOrganizationStoresViaApi } = await import("./org-config-api-client.js");
    const result = await fetchOrganizationStoresViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
    });

    expect(result.stores[0].legacyId).toBe("shami");
    const [url] = fetchMock.mock.lastCall!;
    expect(String(url)).toContain("/api/v1/stores?status=active");
  });

  it("builds employee org bundle without calling members api", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async (url) => {
        const path = String(url);
        if (path.includes("/api/v1/stores/") && path.includes("/sales-channels")) {
          return new Response(JSON.stringify({
            channels: [{
              id: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
              name: "Cash",
              status: "active",
            }],
          }), { status: 200 });
        }
        if (path.includes("/api/v1/stores")) {
          return new Response(JSON.stringify({
            stores: [{
              id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
              name: "Shami",
              location: "",
              status: "active",
            }],
          }), { status: 200 });
        }
        if (path.includes("/api/v1/members")) {
          throw new Error("members api should not be called for employee bundle");
        }
        return new Response("{}", { status: 404 });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchOrgConfigBundleViaApi } = await import("./org-config-api-client.js");
    const bundle = await fetchOrgConfigBundleViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
      actorRole: "employee",
    });

    expect(bundle.members).toHaveLength(1);
    expect(bundle.members[0].userId).toBe("4cf1450d-08d8-4ca1-b180-1c2642174a79");
    expect(bundle.members[0].storeAccess).toHaveLength(1);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/v1/members"))).toBe(false);
  });
});
