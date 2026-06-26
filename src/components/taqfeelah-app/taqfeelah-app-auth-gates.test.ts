import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  TaqfeelahAppOrgErrorGate,
  TaqfeelahAppOrgLoadingGate,
} from "./taqfeelah-app-auth-gates";

const mojibakePattern = /ط¬|طھ|ط¨|ط§|ظٹ|ظ„|â|€/;

describe("taqfeelah app auth gates", () => {
  it("renders Arabic organization loading copy without mojibake", () => {
    const html = renderToStaticMarkup(createElement(TaqfeelahAppOrgLoadingGate, { lang: "ar" }));

    expect(html).toContain("جاري تحميل بيانات المنشأة من قاعدة البيانات");
    expect(html).not.toMatch(mojibakePattern);
  });

  it("renders Arabic organization error copy without mojibake", () => {
    const html = renderToStaticMarkup(
      createElement(TaqfeelahAppOrgErrorGate, { lang: "ar", orgConfigSyncError: "فشل الاتصال" }),
    );

    expect(html).toContain("تعذر تحميل بيانات المنشأة");
    expect(html).not.toMatch(mojibakePattern);
  });
});

