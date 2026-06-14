import { describe, expect, it } from "vitest";
import { buildOwnerCloseoutShareCaption } from "./owner-closeout-share";

describe("buildOwnerCloseoutShareCaption", () => {
  it("builds Arabic day caption for a single store", () => {
    const caption = buildOwnerCloseoutShareCaption({
      lang: "ar",
      storeName: "ARZ",
      period: "day",
      periodLabel: "13-06-2026",
    });
    expect(caption).toBe("تقفيلة محل ARZ ليوم 13-06-2026");
  });

  it("builds Arabic month caption for a single store", () => {
    const caption = buildOwnerCloseoutShareCaption({
      lang: "ar",
      storeName: "مشويات المعلم الشامي",
      period: "month",
      periodLabel: "06-2026",
    });
    expect(caption).toBe("تقفيلة محل مشويات المعلم الشامي لشهر 06-2026");
  });

  it("builds combined stores caption for the active period", () => {
    const caption = buildOwnerCloseoutShareCaption({
      lang: "ar",
      period: "day",
      periodLabel: "02-06-2026",
      combined: true,
    });
    expect(caption).toBe("تقفيلة مقارنة المحلات ليوم 02-06-2026");
  });

  it("builds report captions with store and period scope", () => {
    const caption = buildOwnerCloseoutShareCaption({
      lang: "ar",
      storeName: "ARZ",
      period: "month",
      periodLabel: "06-2026",
      reportKind: "outflow",
    });
    expect(caption).toBe("تقرير الخارج لمحل ARZ لشهر 06-2026");
  });
});
