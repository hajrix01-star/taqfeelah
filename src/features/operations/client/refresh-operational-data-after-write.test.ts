import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { refreshOperationalDataAfterWrite } from "./refresh-operational-data-after-write";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";

describe("refreshOperationalDataAfterWrite", () => {
  it("invalidates closeouts and register scopes after a financial write", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    const loadOperationalEntriesFromApi = vi.fn(async () => []);

    await refreshOperationalDataAfterWrite(queryClient, loadOperationalEntriesFromApi);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: operationalQueryKeys.closeoutsPrefix() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: operationalQueryKeys.registerEntriesPrefix() });
    expect(loadOperationalEntriesFromApi).toHaveBeenCalledWith({ invalidateScopes: [] });
  });
});
