import { describe, expect, it } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders } from "./apply-security-headers";

describe("applySecurityHeaders", () => {
  it("sets nonce-based CSP on pass-through responses", () => {
    const request = new NextRequest("https://taqfeelah.com/app");
    const response = applySecurityHeaders(request);

    const csp = response.headers.get("Content-Security-Policy") || "";
    const nonce = response.headers.get("x-nonce") || "";

    expect(nonce.length).toBeGreaterThan(8);
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(csp).not.toMatch(/script-src[^;]*unsafe-eval/);
  });

  it("preserves upstream redirect status and location", () => {
    const request = new NextRequest("https://taqfeelah.com/saas-admin");
    const redirect = NextResponse.redirect(new URL("https://taqfeelah.com/saas-admin/login"));
    const response = applySecurityHeaders(request, redirect);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/saas-admin/login");
    expect(response.headers.get("Content-Security-Policy")).toContain("'strict-dynamic'");
  });
});
