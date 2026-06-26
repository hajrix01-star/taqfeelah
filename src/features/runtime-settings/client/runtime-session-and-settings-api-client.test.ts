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

  it("sends runtime auth headers for settings reads", async () => {
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

  it("dedupes concurrent runtime settings reads for the same auth context", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      () => new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchRuntimeSettingsViaApi } = await import("./runtime-session-and-settings-api-client.js");
    const auth = {
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
    };
    const first = fetchRuntimeSettingsViaApi(auth);
    const second = fetchRuntimeSettingsViaApi(auth);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch?.(new Response(JSON.stringify({ settings: { staff: [] } }), { status: 200 }));

    const [firstPayload, secondPayload] = await Promise.all([first, second]);
    expect(firstPayload).toEqual(secondPayload);
  });
});
