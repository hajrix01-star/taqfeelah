import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("runtime settings api client", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP = JSON.stringify({
      owner: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("sends prototype auth headers for runtime settings reads", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({ settings: { staff: [] } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchRuntimeSettingsViaApi } = await import("./runtime-session-and-settings-api-client.js");
    await fetchRuntimeSettingsViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/runtime/settings", {
      method: "GET",
      credentials: "include",
      headers: {
        "x-organization-id": "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
        "x-user-id": "e8f3e35b-6051-4da3-8b10-979700c2f00f",
        "x-member-role": "owner",
      },
    });
  });
});
