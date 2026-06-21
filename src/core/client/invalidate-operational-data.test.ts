import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  invalidateOperationalData,
  invalidateOperationalDataBestEffort,
  OPERATIONAL_SCOPES_AFTER_FINANCIAL_WRITE,
} from "./invalidate-operational-data";
import { operationalQueryKeys } from "./operational-query-keys";

describe("invalidateOperationalData", () => {
  it("invalidates all operational query prefixes by default", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);

    await invalidateOperationalData(queryClient);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: operationalQueryKeys.all });
  });

  it("invalidates only selected scopes after financial writes", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);

    await invalidateOperationalData(queryClient, {
      scopes: OPERATIONAL_SCOPES_AFTER_FINANCIAL_WRITE,
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(OPERATIONAL_SCOPES_AFTER_FINANCIAL_WRITE.length);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: operationalQueryKeys.registerEntriesPrefix() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: operationalQueryKeys.closeoutsPrefix() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: operationalQueryKeys.reportsPrefix() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: operationalQueryKeys.summaryPrefix() });
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: operationalQueryKeys.all });
  });

  it("does not throw on best-effort invalidation failure", async () => {
    const queryClient = new QueryClient();
    vi.spyOn(queryClient, "invalidateQueries").mockRejectedValue(new Error("network"));

    const result = await invalidateOperationalDataBestEffort(queryClient);

    expect(result.refreshFailed).toBe(true);
  });
});
