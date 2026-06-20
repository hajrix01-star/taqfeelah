import { describe, expect, it } from "vitest";
import { mapCloseoutSyncErrorToUserMessage } from "./closeout-sync-errors";

describe("mapCloseoutSyncErrorToUserMessage", () => {
  it("maps inaccessible store errors to Arabic guidance", () => {
    expect(mapCloseoutSyncErrorToUserMessage(
      new Error("Store is not accessible for this organization."),
      "ar",
    )).toContain("تعذر الوصول");
  });
});
