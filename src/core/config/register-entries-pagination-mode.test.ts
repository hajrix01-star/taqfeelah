import { afterEach, describe, expect, it, vi } from "vitest";
import { isRegisterEntriesPaginationEnabled } from "./register-entries-pagination-mode";

describe("register entries pagination mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables pagination when explicitly true", () => {
    vi.stubEnv("NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "false");
    expect(isRegisterEntriesPaginationEnabled()).toBe(true);
  });

  it("disables pagination when explicitly false", () => {
    vi.stubEnv("NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED", "false");
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "true");
    expect(isRegisterEntriesPaginationEnabled()).toBe(false);
  });

  it("inherits entries API flag when pagination flag is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_REGISTER_ENTRIES_PAGINATION_ENABLED", "");
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "true");
    expect(isRegisterEntriesPaginationEnabled()).toBe(true);
  });
});
