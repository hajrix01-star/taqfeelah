import { describe, expect, it, vi } from "vitest";
import {
  buildRegisterCloseoutResolveOptions,
  createFetchStoreCloseoutsForRegister,
  resolveRegisterCloseoutFromEntry,
} from "./register-closeout-resolution";

describe("register-closeout-resolution", () => {
  it("returns undefined fetch helper when API context is disabled", () => {
    expect(createFetchStoreCloseoutsForRegister({ enabled: false })).toBeUndefined();
  });

  it("returns undefined fetch helper when API ids are missing", () => {
    expect(createFetchStoreCloseoutsForRegister({
      enabled: true,
      organizationId: "",
      actorUserId: "",
    })).toBeUndefined();
  });

  it("builds resolve options with targeted fetch fallback", () => {
    const fetchStoreCloseouts = vi.fn(async () => []);
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
    expect(fetchStoreCloseouts).not.toHaveBeenCalled();
  });

  it("returns null when entry has no closeout id", async () => {
    await expect(resolveRegisterCloseoutFromEntry({}, { cachedCloseouts: [] })).resolves.toBeNull();
  });
});
