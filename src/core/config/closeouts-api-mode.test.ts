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

  it("uses strict mode only outside prototype access", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE", "false");
    expect(isCloseoutsApiStrictMode()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_PROTOTYPE_ACCESS_MODE", "true");
    expect(isCloseoutsApiStrictMode()).toBe(false);
  });
});
