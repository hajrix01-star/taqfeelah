import { afterEach, describe, expect, it, vi } from "vitest";
import {
  safeDeleteIndexedDbValue,
  safeGetIndexedDbValue,
  safePutIndexedDbValue,
} from "./safe-indexed-db.js";

describe("safe indexedDB helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns safe fallbacks when indexedDB is unavailable", async () => {
    vi.stubGlobal("indexedDB", undefined);

    const config = { databaseName: "test-db", storeName: "items" };

    await expect(safeGetIndexedDbValue(config, "key")).resolves.toBeNull();
    await expect(safePutIndexedDbValue(config, "key", "value")).resolves.toBe(false);
    await expect(safeDeleteIndexedDbValue(config, "key")).resolves.toBe(false);
  });

  it("respects disabled browser persistence policy", async () => {
    vi.stubEnv("NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE", "true");
    vi.stubGlobal("indexedDB", { open: vi.fn() });

    const config = { databaseName: "test-db", storeName: "items" };

    await expect(safeGetIndexedDbValue(config, "key")).resolves.toBeNull();
    await expect(safePutIndexedDbValue(config, "key", "value")).resolves.toBe(false);
    await expect(safeDeleteIndexedDbValue(config, "key")).resolves.toBe(false);
  });
});
