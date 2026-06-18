import { afterEach, describe, expect, it, vi } from "vitest";

describe("lan-hint route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns 404 in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(404);
  });

  it("returns LAN metadata outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { GET } = await import("./route");
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({
        urls: expect.any(Array),
        port: expect.any(Number),
      }),
    );
  });
});
