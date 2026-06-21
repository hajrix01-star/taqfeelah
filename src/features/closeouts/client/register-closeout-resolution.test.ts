import { describe, expect, it, vi } from "vitest";
import {
  buildRegisterCloseoutResolveOptions,
  createFetchStoreCloseoutsForRegister,
} from "./register-closeout-resolution";

describe("register-closeout-resolution", () => {
  it("returns no-op fetch helper when API context is disabled", async () => {
    const helper = createFetchStoreCloseoutsForRegister({ enabled: false });
    await expect(helper("store-a", "2026-06-21")).resolves.toEqual([]);
  });

  it("returns no-op fetch helper when API ids are missing", async () => {
    const helper = createFetchStoreCloseoutsForRegister({
      enabled: true,
      organizationId: "",
      actorUserId: "",
    });
    await expect(helper("store-a", "2026-06-21")).resolves.toEqual([]);
  });

  it("builds resolve options with date-scoped fetch fallback", () => {
    const options = buildRegisterCloseoutResolveOptions({
      cachedCloseouts: [],
      reloadCloseouts: async () => [],
      apiContext: {
        enabled: true,
        organizationId: "11111111-1111-4111-8111-111111111111",
        actorUserId: "22222222-2222-4222-8222-222222222222",
      },
    });
    expect(typeof options.fetchStoreCloseouts).toBe("function");
    expect(options.reloadCloseouts).toBeTypeOf("function");
  });
});
