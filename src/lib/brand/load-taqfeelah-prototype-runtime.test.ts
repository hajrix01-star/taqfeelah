import { describe, expect, it, vi } from "vitest";
import {
  APP_RUNTIME_LOAD_MAX_ATTEMPTS,
  APP_RUNTIME_LOAD_RETRY_MS,
  loadTaqfeelahPrototypeRuntime,
} from "./load-taqfeelah-prototype-runtime";

describe("loadTaqfeelahPrototypeRuntime", () => {
  it("retries transient import failures before succeeding", async () => {
    const RuntimeStub = (() => null) as import("react").ComponentType;
    const importRuntime = vi
      .fn<() => Promise<{ default: import("react").ComponentType | undefined }>>()
      .mockRejectedValueOnce(new Error("chunk-failed"))
      .mockResolvedValueOnce({ default: RuntimeStub });

    const wait = vi.fn(async () => {});

    const runtime = await loadTaqfeelahPrototypeRuntime({
      importRuntime,
      maxAttempts: APP_RUNTIME_LOAD_MAX_ATTEMPTS,
      retryDelayMs: APP_RUNTIME_LOAD_RETRY_MS,
      wait,
    });

    expect(runtime).toBeTypeOf("function");
    expect(importRuntime).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledTimes(1);
    expect(wait).toHaveBeenCalledWith(APP_RUNTIME_LOAD_RETRY_MS);
  });

  it("throws after exhausting all attempts", async () => {
    const importRuntime = vi
      .fn<() => Promise<{ default: import("react").ComponentType | undefined }>>()
      .mockRejectedValue(new Error("chunk-failed"));
    const wait = vi.fn(async () => {});

    await expect(
      loadTaqfeelahPrototypeRuntime({
        importRuntime,
        maxAttempts: 2,
        retryDelayMs: 10,
        wait,
      }),
    ).rejects.toThrow("chunk-failed");

    expect(importRuntime).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledTimes(1);
  });
});
