import { describe, expect, it } from "vitest";
import {
  DEFAULT_NEW_STORE_INCOME_SOURCE_IDS,
  DEFAULT_SALES_CHANNEL_UUIDS,
  INCOME_SOURCE_CATALOG,
  buildCatalogUuidMap,
  getCatalogEntry,
  listCatalogByKind,
  resolveIncomeSourceKind,
} from "./income-source-catalog";

describe("income-source-catalog", () => {
  it("defaults new stores to cash and card", () => {
    expect(DEFAULT_NEW_STORE_INCOME_SOURCE_IDS).toEqual(["cash", "card"]);
  });

  it("includes keeta as a sales channel with stable uuid", () => {
    const keeta = getCatalogEntry("keeta");
    expect(keeta).toMatchObject({
      kind: "sales_channel",
      nameAr: "كيتا",
      nameEn: "Keeta",
      uuid: "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
    });
    expect(DEFAULT_SALES_CHANNEL_UUIDS.keeta).toBe(keeta?.uuid);
  });

  it("classifies payment methods and sales channels", () => {
    expect(listCatalogByKind("payment_method").map((entry) => entry.legacyId)).toEqual([
      "cash",
      "card",
      "mada",
      "bank",
      "apple",
      "online",
    ]);
    expect(listCatalogByKind("sales_channel").map((entry) => entry.legacyId)).toEqual([
      "jahez",
      "hunger",
      "keeta",
    ]);
  });

  it("resolves kind from legacy metadata", () => {
    expect(resolveIncomeSourceKind({ legacyId: "cash" })).toBe("payment_method");
    expect(resolveIncomeSourceKind({ legacyId: "jahez" })).toBe("sales_channel");
    expect(resolveIncomeSourceKind({ custom: true, kind: "sales_channel" })).toBe("sales_channel");
  });

  it("builds a complete uuid map for provisioning", () => {
    const map = buildCatalogUuidMap();
    expect(Object.keys(map).sort()).toEqual(
      INCOME_SOURCE_CATALOG.map((entry) => entry.legacyId).sort(),
    );
  });
});
