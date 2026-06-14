import { describe, expect, it } from "vitest";
import {
  DEFAULT_NEW_STORE_SALES_CHANNEL_IDS,
  defaultSalesChannelDbName,
} from "./sales-channel-catalog";

describe("sales-channel-catalog defaults", () => {
  it("uses cash and bank for new stores", () => {
    expect(DEFAULT_NEW_STORE_SALES_CHANNEL_IDS).toEqual(["cash", "bank"]);
  });

  it("stores Arabic names for built-in default channels", () => {
    expect(defaultSalesChannelDbName({ id: "cash", text: "cash" })).toBe("نقد");
    expect(defaultSalesChannelDbName({ id: "bank", text: "bank" })).toBe("بنك");
  });
});
