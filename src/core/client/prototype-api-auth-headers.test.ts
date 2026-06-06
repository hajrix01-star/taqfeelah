import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPrototypeApiAuthHeaders } from "./prototype-api-auth-headers";

describe("buildPrototypeApiAuthHeaders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps prototype actor keys to UUID headers", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP",
      JSON.stringify({ owner: "e8f3e35b-6051-4da3-8b10-979700c2f00f" }),
    );

    expect(
      buildPrototypeApiAuthHeaders({
        organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
        actorUserId: "owner",
        actorRole: "owner",
      }),
    ).toEqual({
      "x-organization-id": "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      "x-user-id": "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      "x-member-role": "owner",
    });
  });
});
