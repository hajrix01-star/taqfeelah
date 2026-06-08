import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readLocalStorageJson, safeSetLocalStorageItem } from "./prototype-storage";

describe("prototype storage helpers", () => {
  const getItem = vi.fn();
  const setItem = vi.fn();

  beforeEach(() => {
    getItem.mockReset();
    setItem.mockReset();
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "prototype");
    vi.stubGlobal("window", {
      localStorage: { getItem, setItem },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reads and writes browser storage in prototype mode", () => {
    getItem.mockReturnValue(JSON.stringify({ ok: true }));

    expect(readLocalStorageJson("taqfeelah_demo", {})).toEqual({ ok: true });
    expect(safeSetLocalStorageItem("taqfeelah_demo", "value")).toEqual({ ok: true });
    expect(setItem).toHaveBeenCalledWith("taqfeelah_demo", "value");
  });

  it("blocks browser storage when persistence is disabled", () => {
    vi.stubEnv("NEXT_PUBLIC_DISABLE_BROWSER_PERSISTENCE", "true");

    expect(readLocalStorageJson("taqfeelah_demo", { fallback: true })).toEqual({ fallback: true });
    expect(safeSetLocalStorageItem("taqfeelah_demo", "value")).toEqual({ ok: false, error: "disabled" });
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });
});
