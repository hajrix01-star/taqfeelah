import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_ORGANIZATION_ID,
  TEST_OWNER_USER_ID,
} from "./helpers";

const createAuthSession = vi.fn();
const resolveAuthSessionFromRequest = vi.fn();

vi.mock("@/features/auth/server/create-auth-session", () => ({
  createAuthSession,
}));

vi.mock("@/core/auth/session-cookie", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/core/auth/session-cookie")>();
  return {
    ...actual,
    resolveAuthSessionFromRequest,
  };
});

describe("auth session route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.AUTH_SESSION_SECRET = "test-session-secret-32chars-min";
    process.env.AUTH_SESSION_COOKIE_NAME = "taqfeelah_session";
    __resetEnvCacheForTests();
    createAuthSession.mockReset();
    resolveAuthSessionFromRequest.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET returns unauthenticated payload when no session cookie exists", async () => {
    resolveAuthSessionFromRequest.mockReturnValue(null);

    const { GET } = await import("../auth/session/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/auth/session"));

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ authenticated: boolean }>(response);
    expect(body.authenticated).toBe(false);
  });

  it("GET returns authenticated session claims", async () => {
    resolveAuthSessionFromRequest.mockReturnValue({
      organizationId: TEST_ORGANIZATION_ID,
      userId: TEST_OWNER_USER_ID,
      role: "owner",
    });

    const { GET } = await import("../auth/session/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/auth/session"));

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ authenticated: boolean; role: string }>(response);
    expect(body.authenticated).toBe(true);
    expect(body.role).toBe("owner");
  });

  it("POST creates auth session and sets cookie", async () => {
    createAuthSession.mockResolvedValueOnce({
      organizationId: TEST_ORGANIZATION_ID,
      userId: TEST_OWNER_USER_ID,
      role: "owner",
    });

    const { POST } = await import("../auth/session/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/auth/session", {
        method: "POST",
        body: JSON.stringify({ mode: "owner_password", username: "owner", password: "demo" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ userId: string }>(response);
    expect(body.userId).toBe(TEST_OWNER_USER_ID);
    expect(response.headers.get("set-cookie")).toContain("taqfeelah_session=");
    expect(createAuthSession).toHaveBeenCalledOnce();
  });

  it("POST fails when session secret is missing", async () => {
    delete process.env.AUTH_SESSION_SECRET;
    __resetEnvCacheForTests();
    createAuthSession.mockResolvedValueOnce({
      organizationId: TEST_ORGANIZATION_ID,
      userId: TEST_OWNER_USER_ID,
      role: "owner",
    });

    const { POST } = await import("../auth/session/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/auth/session", {
        method: "POST",
        body: JSON.stringify({ mode: "owner_password", username: "owner", password: "demo" }),
      }),
    );

    expect(response.status).toBe(503);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("DELETE clears auth session cookie", async () => {
    const { DELETE } = await import("../auth/session/route");
    const response = await DELETE();

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ success: boolean }>(response);
    expect(body.success).toBe(true);
    expect(response.headers.get("set-cookie")).toContain("taqfeelah_session=");
  });
});
