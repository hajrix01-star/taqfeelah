import { describe, expect, it, vi } from "vitest";
import {
  buildRegisterCloseoutDeleteRequest,
  closeoutDeleteRequestToRecord,
  resolveCloseoutRecordForRegisterSummary,
} from "./register-closeout-summary-service";

describe("register-closeout-summary-service", () => {
  it("builds delete request from summary ref", () => {
    expect(buildRegisterCloseoutDeleteRequest({
      closeoutId: "c-1",
      businessId: "store-a",
      date: "2026-06-21",
    })).toEqual({
      closeoutId: "c-1",
      storeId: "store-a",
      date: "2026-06-21",
    });
  });

  it("maps delete request to closeout record shape", () => {
    expect(closeoutDeleteRequestToRecord({
      closeoutId: "c-1",
      storeId: "store-a",
    })).toEqual({
      id: "c-1",
      storeId: "store-a",
      date: undefined,
    });
  });

  it("resolves closeout via targeted store/date fetch", async () => {
    const fetchStoreCloseouts = vi.fn(async () => ([
      { id: "c-1", storeId: "store-a", date: "2026-06-21", sales: [] },
    ]));

    const result = await resolveCloseoutRecordForRegisterSummary(
      { closeoutId: "c-1", businessId: "store-a", date: "2026-06-21" },
      { fetchStoreCloseouts },
    );

    expect(fetchStoreCloseouts).toHaveBeenCalledWith("store-a", "2026-06-21");
    expect(result?.id).toBe("c-1");
  });
});
