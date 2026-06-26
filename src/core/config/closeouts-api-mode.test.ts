import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isCloseoutsApiDbSourceMode,
  isCloseoutsApiEnabled,
  isCloseoutsApiStrictMode,
} from "./closeouts-api-mode";

describe("closeouts api mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables closeouts API when flag is true", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ENABLED", "true");
    expect(isCloseoutsApiEnabled()).toBe(true);
    expect(isCloseoutsApiDbSourceMode()).toBe(true);
  });

  it("disables closeouts API by default", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ENABLED", "");
    expect(isCloseoutsApiEnabled()).toBe(false);
  });

  it("uses strict mode in production app mode", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    expect(isCloseoutsApiStrictMode()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "local");
    expect(isCloseoutsApiStrictMode()).toBe(false);
  });
});
