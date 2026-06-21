import { describe, expect, it } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders } from "./apply-security-headers";

describe("applySecurityHeaders", () => {
  it("sets legacy CSP on pass-through responses by default", () => {
    const request = new NextRequest("https://taqfeelah.com/app");
    const response = applySecurityHeaders(request);

    const csp = response.headers.get("Content-Security-Policy") || "";

    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("strict-dynamic");
    expect(response.headers.get("x-nonce")).toBeNull();
  });

  it("preserves upstream redirect status and location", () => {
    const request = new NextRequest("https://taqfeelah.com/saas-admin");
    const redirect = NextResponse.redirect(new URL("https://taqfeelah.com/saas-admin/login"));
    const response = applySecurityHeaders(request, redirect);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/saas-admin/login");
    expect(response.headers.get("Content-Security-Policy")).toContain("'unsafe-inline'");
  });
});
