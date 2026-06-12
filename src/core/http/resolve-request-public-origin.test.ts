import { describe, expect, it } from "vitest";
import {
  buildPublicUrl,
  isInternalHost,
  resolvePublicOriginFromHeaders,
} from "@/core/http/resolve-request-public-origin";

describe("resolvePublicOriginFromHeaders", () => {
  it("prefers x-forwarded-host over internal host header", () => {
    const headers = new Headers({
      host: "localhost:3010",
      "x-forwarded-host": "taqfeelah.com",
      "x-forwarded-proto": "https",
    });

    expect(resolvePublicOriginFromHeaders(headers)).toBe("https://taqfeelah.com");
  });

  it("falls back to configured public origin when host is internal", () => {
    const previous = process.env.APP_PUBLIC_ORIGIN;
    process.env.APP_PUBLIC_ORIGIN = "https://taqfeelah.com";

    try {
      const headers = new Headers({
        host: "localhost:3010",
      });
      expect(resolvePublicOriginFromHeaders(headers)).toBe("https://taqfeelah.com");
    } finally {
      if (previous === undefined) delete process.env.APP_PUBLIC_ORIGIN;
      else process.env.APP_PUBLIC_ORIGIN = previous;
    }
  });

  it("builds public redirect urls from configured origin", () => {
    const previous = process.env.APP_PUBLIC_ORIGIN;
    process.env.APP_PUBLIC_ORIGIN = "https://taqfeelah.com";

    try {
      const headers = new Headers({ host: "localhost:3010" });
      expect(buildPublicUrl("/saas-admin/login?next=%2Fsaas-admin", headers))
        .toBe("https://taqfeelah.com/saas-admin/login?next=%2Fsaas-admin");
    } finally {
      if (previous === undefined) delete process.env.APP_PUBLIC_ORIGIN;
      else process.env.APP_PUBLIC_ORIGIN = previous;
    }
  });
});

describe("isInternalHost", () => {
  it("detects localhost and loopback hosts", () => {
    expect(isInternalHost("localhost:3010")).toBe(true);
    expect(isInternalHost("127.0.0.1:3010")).toBe(true);
    expect(isInternalHost("taqfeelah.com")).toBe(false);
  });
});
