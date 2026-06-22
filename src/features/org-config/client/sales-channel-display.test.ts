import { describe, expect, it } from "vitest";
import {
  entryRowMatchesIncomeSourceFilter,
  resolveAggregatedChannelShape,
  resolveRegisterIncomeSourceFilterKey,
  resolveSalesChannelLabel,
  resolveSalesChannelRowLabel,
  resolveSalesChannelTextKey,
} from "./sales-channel-display";

const copy = {
  ar: { cash: "نقد", bank: "بنك", mada: "مدى" },
  en: { cash: "Cash", bank: "Bank", mada: "Mada" },
};
const text = (lang: "ar" | "en", key: string) => copy[lang][key as keyof typeof copy.ar] || key;
const channelName = (channel: Record<string, unknown>, lang: "ar" | "en") => (
  resolveSalesChannelLabel(channel, lang, text)
);

describe("resolveSalesChannelTextKey", () => {
  it("resolves built-in channel text keys", () => {
    expect(resolveSalesChannelTextKey({ text: "cash", custom: false })).toBe("cash");
    expect(resolveSalesChannelTextKey({ legacyId: "mada" })).toBe("mada");
  });

  it("maps common Arabic aliases to built-in keys", () => {
    expect(resolveSalesChannelTextKey({ custom: true, nameAr: "نقد", nameEn: "نقد" })).toBe("cash");
    expect(resolveSalesChannelTextKey({ custom: true, nameAr: "بنك", nameEn: "بنك" })).toBe("bank");
  });
});

describe("resolveSalesChannelLabel", () => {
  it("translates known channels in English UI", () => {
    expect(resolveSalesChannelLabel({ custom: true, nameAr: "نقد", nameEn: "نقد" }, "en", text)).toBe("Cash");
    expect(resolveSalesChannelLabel({ custom: true, nameAr: "بنك", nameEn: "بنك" }, "en", text)).toBe("Bank");
  });

  it("keeps unknown custom channel names per language", () => {
    expect(resolveSalesChannelLabel({ custom: true, nameAr: "توصيل", nameEn: "Delivery" }, "en", text)).toBe("Delivery");
  });
});

describe("resolveSalesChannelRowLabel", () => {
  it("prefers configured channel metadata over Arabic snapshot names", () => {
    const label = resolveSalesChannelRowLabel(
      { channelId: "cash", name: "نقد" },
      [{ id: "cash", text: "cash", custom: false }],
      "en",
      channelName,
    );
    expect(label).toBe("Cash");
  });

  it("translates snapshot-only Arabic aliases", () => {
    const label = resolveSalesChannelRowLabel(
      { channelId: "uuid-1", name: "بنك" },
      [],
      "en",
      channelName,
    );
    expect(label).toBe("Bank");
  });
});

describe("resolveRegisterIncomeSourceFilterKey", () => {
  it("merges legacy uuid and catalog ids for the same preset", () => {
    const cashUuid = "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";
    const configured = [{ id: cashUuid, legacyId: "cash", text: "cash", custom: false }];
    expect(resolveRegisterIncomeSourceFilterKey({ channelId: "cash" }, configured)).toBe("cash");
    expect(resolveRegisterIncomeSourceFilterKey({ channelId: cashUuid }, configured)).toBe("cash");
  });

  it("matches rows against canonical filter keys", () => {
    const cashUuid = "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";
    const configured = [{ id: cashUuid, legacyId: "cash", text: "cash", custom: false }];
    expect(entryRowMatchesIncomeSourceFilter({ channelId: cashUuid, amount: 10 }, "cash", configured)).toBe(true);
    expect(entryRowMatchesIncomeSourceFilter({ channelId: "jahez", amount: 10 }, "cash", configured)).toBe(false);
  });
});

describe("resolveAggregatedChannelShape", () => {
  it("returns built-in channel shape for Arabic snapshot aliases", () => {
    expect(resolveAggregatedChannelShape({ channelId: "uuid-1", name: "نقد" }, [])).toEqual({
      id: "uuid-1",
      text: "cash",
      custom: false,
      amount: 0,
    });
  });

  it("enriches a UUID-only configured channel with the authoritative snapshot name", () => {
    const shape = resolveAggregatedChannelShape(
      { channelId: "8d4b2f3a-9c5e-4f0b-b2d3-4e5f6a7b8c9d", name: "Apple Pay" },
      [{ id: "8d4b2f3a-9c5e-4f0b-b2d3-4e5f6a7b8c9d" }],
    );

    expect(shape).toMatchObject({
      id: "8d4b2f3a-9c5e-4f0b-b2d3-4e5f6a7b8c9d",
      name: "Apple Pay",
      custom: true,
    });
    expect(resolveSalesChannelLabel(shape, "ar", text)).toBe("Apple Pay");
    expect(resolveSalesChannelLabel(shape, "ar", text)).not.toContain("8d4b2f3a");
  });

  it("does not treat a UUID legacy id as a human display label", () => {
    const channelId = "8d4b2f3a-9c5e-4f0b-b2d3-4e5f6a7b8c9d";
    const shape = resolveAggregatedChannelShape(
      { channelId, name: "Apple Pay" },
      [{ id: channelId, legacyId: channelId, custom: false }],
    );

    expect(resolveSalesChannelLabel(shape, "ar", text)).toBe("apple");
  });
});
