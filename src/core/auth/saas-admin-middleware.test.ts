import { describe, expect, it } from "vitest";
import { createSignedAuthSessionCookieValue } from "@/core/auth/session-cookie";
import { handleSaasAdminMiddleware } from "@/core/auth/saas-admin-middleware";
import { NextRequest } from "next/server";

const ownerUserId = "11111111-1111-4111-8111-111111111111";
const secret = "test-session-secret-32chars-min";

function buildRequest(path: string, cookieValue?: string) {
  const headers = new Headers();
  if (cookieValue) {
    headers.set("cookie", `taqfeelah_session=${cookieValue}`);
  }
  return new NextRequest(`https://taqfeelah.com${path}`, { headers });
}

function enabledEnv(overrides: Record<string, string> = {}) {
  return {
    SAAS_ADMIN_API_ENABLED: "true",
    NEXT_PUBLIC_SAAS_ADMIN_ENABLED: "true",
    SAAS_PLATFORM_ADMIN_USER_IDS: ownerUserId,
    AUTH_SESSION_COOKIE_NAME: "taqfeelah_session",
    AUTH_SESSION_SECRET: secret,
    ...overrides,
  };
}

describe("handleSaasAdminMiddleware", () => {
  it("returns 503 when SaaS admin API is disabled", async () => {
    const response = await handleSaasAdminMiddleware(
      buildRequest("/api/v1/saas-admin/overview"),
      { SAAS_ADMIN_API_ENABLED: "false" },
    );

    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toMatchObject({
      error: { code: "SERVICE_UNAVAILABLE" },
    });
  });

  it("returns 401 when SaaS admin API is enabled without a session", async () => {
    const response = await handleSaasAdminMiddleware(
      buildRequest("/api/v1/saas-admin/overview"),
      enabledEnv(),
    );

    expect(response?.status).toBe(401);
  });

  it("returns 403 when session user is not owner and not on platform admin allowlist", async () => {
    const cookie = createSignedAuthSessionCookieValue(
      {
        organizationId: "22222222-2222-4222-8222-222222222222",
        userId: "33333333-3333-4333-8333-333333333333",
        role: "employee",
      },
      secret,
    );

    const response = await handleSaasAdminMiddleware(
      buildRequest("/api/v1/saas-admin/overview", cookie),
      enabledEnv(),
    );

    expect(response?.status).toBe(403);
  });

  it("allows platform admin API requests with a valid session", async () => {
    const cookie = createSignedAuthSessionCookieValue(
      {
        organizationId: "22222222-2222-4222-8222-222222222222",
        userId: ownerUserId,
        role: "owner",
      },
      secret,
    );

    const response = await handleSaasAdminMiddleware(
      buildRequest("/api/v1/saas-admin/overview", cookie),
      enabledEnv(),
    );

    expect(response).toBeNull();
  });

  it("does not block /saas-admin pages when the client flag is disabled", async () => {
    const response = await handleSaasAdminMiddleware(
      buildRequest("/saas-admin/overview"),
      { NEXT_PUBLIC_SAAS_ADMIN_ENABLED: "false" },
    );

    expect(response).toBeNull();
  });

  it("redirects unauthenticated /saas-admin pages to login when enabled", async () => {
    const response = await handleSaasAdminMiddleware(
      buildRequest("/saas-admin/overview"),
      enabledEnv({ SAAS_ADMIN_API_ENABLED: "false" }),
    );

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain("/saas-admin/login");
    expect(response?.headers.get("location")).toContain("next=%2Fsaas-admin%2Foverview");
  });

  it("redirects using configured public origin when upstream host is internal", async () => {
    const previous = process.env.APP_PUBLIC_ORIGIN;
    process.env.APP_PUBLIC_ORIGIN = "https://taqfeelah.com";

    try {
      const response = await handleSaasAdminMiddleware(
        new NextRequest("https://localhost:3010/saas-admin/overview", { headers: new Headers() }),
        enabledEnv({ SAAS_ADMIN_API_ENABLED: "false" }),
      );

      expect(response?.status).toBe(307);
      expect(response?.headers.get("location"))
        .toBe("https://taqfeelah.com/saas-admin/login?next=%2Fsaas-admin%2Foverview");
    } finally {
      if (previous === undefined) delete process.env.APP_PUBLIC_ORIGIN;
      else process.env.APP_PUBLIC_ORIGIN = previous;
    }
  });

  it("allows authenticated /saas-admin pages when enabled", async () => {
    const cookie = createSignedAuthSessionCookieValue(
      {
        organizationId: "22222222-2222-4222-8222-222222222222",
        userId: ownerUserId,
        role: "owner",
      },
      secret,
    );

    const response = await handleSaasAdminMiddleware(
      buildRequest("/saas-admin/overview", cookie),
      enabledEnv({ SAAS_ADMIN_API_ENABLED: "false" }),
    );

    expect(response).toBeNull();
  });

  it("does not redirect /saas-admin/login", async () => {
    const response = await handleSaasAdminMiddleware(
      buildRequest("/saas-admin/login"),
      enabledEnv({ SAAS_ADMIN_API_ENABLED: "false" }),
    );

    expect(response).toBeNull();
  });
});
