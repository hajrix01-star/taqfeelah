import { afterEach, describe, expect, it, vi } from "vitest";
import { isPhase9ApiEnabled } from "./phase9-api-mode";

describe("phase9 api mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("inherits entries API flag when phase9 flag is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_PHASE9_API_ENABLED", "");
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "true");
    expect(isPhase9ApiEnabled()).toBe(true);
  });

  it("can disable phase9 while entries API stays on", () => {
    vi.stubEnv("NEXT_PUBLIC_PHASE9_API_ENABLED", "false");
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "true");
    expect(isPhase9ApiEnabled()).toBe(false);
  });
});
