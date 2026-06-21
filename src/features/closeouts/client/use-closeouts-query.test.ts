import { describe, expect, it } from "vitest";
import { buildCloseoutsQueryKey } from "@/features/closeouts/client/use-closeouts-query";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";

describe("useCloseoutsQuery helpers", () => {
  it("builds stable closeouts query keys from auto-load context", () => {
    expect(buildCloseoutsQueryKey("owner|shami|register|2026-01-01-2026-06-30")).toEqual(
      operationalQueryKeys.closeouts({ autoLoadKey: "owner|shami|register|2026-01-01-2026-06-30" }),
    );
  });
});
