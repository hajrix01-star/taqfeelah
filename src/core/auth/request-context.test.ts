import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveRequestContext } from "./request-context";
import { createSignedAuthSessionCookieValue } from "./session-cookie";
import { __resetEnvCacheForTests } from "@/core/config/env";

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api", { headers });
}

describe("resolveRequestContext", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __resetEnvCacheForTests();
  });

  it("uses signed session cookie when present", () => {
    process.env.AUTH_SESSION_SECRET = "test-secret-for-session-cookie-123";
    process.env.AUTH_SESSION_COOKIE_NAME = "taq_sess";
    process.env.ALLOW_HEADER_AUTH_CONTEXT = "false";
    __resetEnvCacheForTests();

    const cookie = createSignedAuthSessionCookieValue(
      {
        organizationId: "11111111-1111-4111-8111-111111111111",
        userId: "22222222-2222-4222-8222-222222222222",
        role: "owner",
      },
      process.env.AUTH_SESSION_SECRET,
    );

    const ctx = resolveRequestContext(
      makeRequest({
        cookie: `taq_sess=${cookie}`,
      }),
      { requireUser: true },
    );

    expect(ctx.organizationId).toBe("11111111-1111-4111-8111-111111111111");
    expect(ctx.userId).toBe("22222222-2222-4222-8222-222222222222");
    expect(ctx.role).toBe("owner");
  });

  it("parses organization context for read endpoints", () => {
    process.env.ALLOW_HEADER_AUTH_CONTEXT = "true";
    delete process.env.AUTH_SESSION_SECRET;
    delete process.env.AUTH_SESSION_COOKIE_NAME;
    __resetEnvCacheForTests();

    const ctx = resolveRequestContext(
      makeRequest({
        "x-organization-id": "11111111-1111-4111-8111-111111111111",
      }),
    );

    expect(ctx.organizationId).toBe("11111111-1111-4111-8111-111111111111");
    expect(ctx.userId).toBeNull();
    expect(ctx.role).toBeNull();
  });

  it("requires user headers for write endpoints when requested", () => {
    process.env.ALLOW_HEADER_AUTH_CONTEXT = "true";
    delete process.env.AUTH_SESSION_SECRET;
    __resetEnvCacheForTests();

    expect(() =>
      resolveRequestContext(
        makeRequest({
          "x-organization-id": "11111111-1111-4111-8111-111111111111",
        }),
        { requireUser: true },
      ),
    ).toThrow("x-user-id");
  });

  it("parses full context when user headers are provided", () => {
    process.env.ALLOW_HEADER_AUTH_CONTEXT = "true";
    delete process.env.AUTH_SESSION_SECRET;
    __resetEnvCacheForTests();

    const ctx = resolveRequestContext(
      makeRequest({
        "x-organization-id": "11111111-1111-4111-8111-111111111111",
        "x-user-id": "22222222-2222-4222-8222-222222222222",
        "x-member-role": "manager",
      }),
      { requireUser: true },
    );

    expect(ctx.organizationId).toBe("11111111-1111-4111-8111-111111111111");
    expect(ctx.userId).toBe("22222222-2222-4222-8222-222222222222");
    expect(ctx.role).toBe("manager");
  });

  it("rejects header context when disabled and no session cookie", () => {
    process.env.ALLOW_HEADER_AUTH_CONTEXT = "false";
    delete process.env.AUTH_SESSION_SECRET;
    __resetEnvCacheForTests();

    expect(() =>
      resolveRequestContext(
        makeRequest({
          "x-organization-id": "11111111-1111-4111-8111-111111111111",
        }),
      ),
    ).toThrow("Session cookie is required");
  });

  it("falls back to env org/user context when headers are missing", () => {
    process.env.ALLOW_HEADER_AUTH_CONTEXT = "true";
    process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID = "11111111-1111-4111-8111-111111111111";
    process.env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID = "22222222-2222-4222-8222-222222222222";
    delete process.env.AUTH_SESSION_SECRET;
    __resetEnvCacheForTests();

    const ctx = resolveRequestContext(makeRequest(), { requireUser: true });

    expect(ctx.organizationId).toBe("11111111-1111-4111-8111-111111111111");
    expect(ctx.userId).toBe("22222222-2222-4222-8222-222222222222");
    expect(ctx.role).toBe("owner");
  });

  it("rejects launch-ready production when header auth bypass is enabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");
    vi.stubEnv("ALLOW_HEADER_AUTH_CONTEXT", "true");
    vi.stubEnv("DATABASE_URL", "postgresql://example");
    vi.stubEnv("AUTH_SESSION_SECRET", "test-secret-min-16-chars");
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_ENTRIES_API_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", "11111111-1111-4111-8111-111111111111");
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID", "22222222-2222-4222-8222-222222222222");
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP", '{"shami":"33333333-3333-4333-8333-333333333333"}');
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP", '{"owner":"22222222-2222-4222-8222-222222222222"}');
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP", '{"cash":"44444444-4444-4444-8444-444444444444"}');
    __resetEnvCacheForTests();

    expect(() => resolveRequestContext(
      makeRequest({
        "x-organization-id": "11111111-1111-4111-8111-111111111111",
        "x-user-id": "22222222-2222-4222-8222-222222222222",
        "x-member-role": "owner",
      }),
      { requireUser: true },
    )).toThrow(/ALLOW_HEADER_AUTH_CONTEXT/);
  });
});
