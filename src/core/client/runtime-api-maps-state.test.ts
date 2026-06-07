import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getRuntimeApiMaps,
  hasRuntimeApiActorMapping,
  setRuntimeApiIdMaps,
} from "./runtime-api-maps-state";

describe("runtime-api-maps-state", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    setRuntimeApiIdMaps(null);
  });

  it("merges env and runtime override maps", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP",
      JSON.stringify({ owner: "e8f3e35b-6051-4da3-8b10-979700c2f00f" }),
    );
    setRuntimeApiIdMaps({
      userIdMap: { ahmed: "4cf1450d-08d8-4ca1-b180-1c2642174a79" },
    });

    const maps = getRuntimeApiMaps();
    expect(maps.userIdMap.owner).toBe("e8f3e35b-6051-4da3-8b10-979700c2f00f");
    expect(maps.userIdMap.ahmed).toBe("4cf1450d-08d8-4ca1-b180-1c2642174a79");
    expect(hasRuntimeApiActorMapping("ahmed")).toBe(true);
  });
});
