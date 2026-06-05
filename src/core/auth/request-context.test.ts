import { describe, expect, it } from "vitest";
import { resolveRequestContext } from "./request-context";
import { createSignedAuthSessionCookieValue } from "./session-cookie";
import { __resetEnvCacheForTests } from "@/core/config/env";

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api", { headers });
}

describe("resolveRequestContext", () => {
  it("uses signed session cookie when present", () => {
    process.env.AUTH_SESSION_SECRET = "test-secret-for-session-cookie-123";
    // cv field is required by session schema
    process.env.AUTH_SESSION_COOKIE_NAME = "taq_sess";
    process.env.ALLOW_HEADER_AUTH_CONTEXT = "false";
    __resetEnvCacheForTests();

    const cookie = createSignedAuthSessionCookieValue(
      {
        organizationId: "11111111-1111-4111-8111-111111111111",
        userId: "22222222-2222-4222-8222-222222222222",
        role: "owner",
        cv: 0,
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
});
