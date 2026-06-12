import { describe, expect, it } from "vitest";
import {
  filterActiveStores,
  formatMemberStoreAccessLabel,
} from "@/features/saas-admin/client/format-member-store-access";

describe("format-member-store-access", () => {
  it("filters archived stores from assignment options", () => {
    expect(
      filterActiveStores([
        { id: "1", status: "active" },
        { id: "2", status: "archived" },
      ]),
    ).toEqual([{ id: "1", status: "active" }]);
  });

  it("formats store access labels", () => {
    expect(
      formatMemberStoreAccessLabel(
        [
          { storeId: "1", storeName: "Main", storeStatus: "active" },
          { storeId: "2", storeName: "Old", storeStatus: "archived" },
        ],
        "No stores",
      ),
    ).toBe("Main، Old (archived)");
  });
});
