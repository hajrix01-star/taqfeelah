import { describe, expect, it } from "vitest";
import {
  resolveAggregatedChannelShape,
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

describe("resolveAggregatedChannelShape", () => {
  it("returns built-in channel shape for Arabic snapshot aliases", () => {
    expect(resolveAggregatedChannelShape({ channelId: "uuid-1", name: "نقد" }, [])).toEqual({
      id: "uuid-1",
      text: "cash",
      custom: false,
      amount: 0,
    });
  });
});
