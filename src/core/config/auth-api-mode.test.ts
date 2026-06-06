import { afterEach, describe, expect, it, vi } from "vitest";
import { isAuthApiEnabled, isAuthDbCredentialsEnabled } from "./auth-api-mode";

describe("auth api mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps auth API disabled by default", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_API_ENABLED", "");
    expect(isAuthApiEnabled()).toBe(false);
  });

  it("enables auth API only when explicitly true", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_API_ENABLED", "true");
    expect(isAuthApiEnabled()).toBe(true);
  });

  it("keeps DB credentials login disabled by default", () => {
    vi.stubEnv("AUTH_DB_CREDENTIALS_ENABLED", "");
    expect(isAuthDbCredentialsEnabled()).toBe(false);
  });
});
