import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchApiJson, parseApiErrorMessage } from "./api-fetch";

describe("api-fetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parseApiErrorMessage returns API message when present", async () => {
    const response = new Response(JSON.stringify({ error: { message: "Invalid credentials." } }), {
      status: 401,
    });
    await expect(parseApiErrorMessage(response, "fallback")).resolves.toBe("Invalid credentials.");
  });

  it("fetchApiJson throws status-style errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 503 })),
    );

    await expect(
      fetchApiJson("/api/v1/stores", {
        errorMessage: "stores list api failed",
        errorStyle: "status",
      }),
    ).rejects.toThrow("stores list api failed: 503");
  });

  it("fetchApiJson returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );

    await expect(fetchApiJson("/api/v1/stores")).resolves.toEqual({ ok: true });
  });
});
