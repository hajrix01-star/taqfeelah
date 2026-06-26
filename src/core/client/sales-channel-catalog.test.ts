import { describe, expect, it } from "vitest";
import {
  DEFAULT_NEW_STORE_INCOME_SOURCE_IDS,
  defaultSalesChannelDbName,
} from "./sales-channel-catalog";

describe("sales-channel-catalog defaults", () => {
  it("uses cash and card for new stores", () => {
    expect(DEFAULT_NEW_STORE_INCOME_SOURCE_IDS).toEqual(["cash", "card"]);
  });

  it("stores Arabic names for built-in default channels", () => {
    expect(defaultSalesChannelDbName({ id: "cash", text: "cash" })).toBe("نقد");
    expect(defaultSalesChannelDbName({ id: "card", text: "card" })).toBe("بطاقة");
  });
});
