import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isEntriesApiDbSourceMode,
  isEntriesApiEnabled,
  isEntriesApiStrictMode,
} from "./entries-api-mode";

describe("entries api mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables entries API when NEXT_PUBLIC_ENTRIES_API_ENABLED=true", () => {
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "true");
    expect(isEntriesApiEnabled()).toBe(true);
    expect(isEntriesApiDbSourceMode()).toBe(true);
  });

  it("inherits closeouts API flag when entries flag is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "");
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ENABLED", "true");
    expect(isEntriesApiEnabled()).toBe(true);
  });

  it("disables entries API when explicitly false", () => {
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "false");
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ENABLED", "true");
    expect(isEntriesApiEnabled()).toBe(false);
  });

  it("uses strict mode in production app mode", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    expect(isEntriesApiStrictMode()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "prototype");
    expect(isEntriesApiStrictMode()).toBe(false);
  });
});
