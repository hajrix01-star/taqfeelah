import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { invalidateOperationalData, invalidateOperationalDataBestEffort } from "./invalidate-operational-data";
import { operationalQueryKeys } from "./operational-query-keys";

describe("invalidateOperationalData", () => {
  it("invalidates all operational query prefixes", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);

    await invalidateOperationalData(queryClient);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: operationalQueryKeys.all });
  });

  it("does not throw on best-effort invalidation failure", async () => {
    const queryClient = new QueryClient();
    vi.spyOn(queryClient, "invalidateQueries").mockRejectedValue(new Error("network"));

    const result = await invalidateOperationalDataBestEffort(queryClient);

    expect(result.refreshFailed).toBe(true);
  });
});
