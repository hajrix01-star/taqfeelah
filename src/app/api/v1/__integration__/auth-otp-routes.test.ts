import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
} from "./helpers";

const requestAuthOtp = vi.fn();
const verifyAuthOtp = vi.fn();

vi.mock("@/features/auth/server/request-auth-otp", () => ({
  requestAuthOtp,
}));

vi.mock("@/features/auth/server/verify-auth-otp", () => ({
  verifyAuthOtp,
}));

describe("auth otp routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    requestAuthOtp.mockReset();
    verifyAuthOtp.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("POST /auth/otp/request accepts whatsapp destination", async () => {
    requestAuthOtp.mockResolvedValueOnce({
      accepted: true,
      deliveryStatus: "stub_not_configured",
    });

    const { POST } = await import("../auth/otp/request/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({
          channel: "whatsapp",
          destination: "+966500000000",
        }),
      }),
    );

    expect(response.status).toBe(202);
    expect(requestAuthOtp).toHaveBeenCalledWith(expect.objectContaining({
      channel: "whatsapp",
      destination: "+966500000000",
      purpose: "owner_login",
    }));
  });

  it("POST /auth/otp/request surfaces validation errors", async () => {
    requestAuthOtp.mockRejectedValueOnce(new ValidationError("Invalid OTP request."));

    const { POST } = await import("../auth/otp/request/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ destination: "" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /auth/otp/verify validates owner login code", async () => {
    verifyAuthOtp.mockResolvedValueOnce({ verified: true });

    const { POST } = await import("../auth/otp/verify/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          channel: "whatsapp",
          destination: "+966500000000",
          code: "1234",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ verified: boolean }>(response);
    expect(body.verified).toBe(true);
    expect(verifyAuthOtp).toHaveBeenCalledWith(expect.objectContaining({
      code: "1234",
      purpose: "owner_login",
    }));
  });

  it("POST /auth/otp/verify surfaces verification errors", async () => {
    verifyAuthOtp.mockRejectedValueOnce(new ValidationError("Invalid OTP code."));

    const { POST } = await import("../auth/otp/verify/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          destination: "+966500000000",
          code: "0000",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(verifyAuthOtp).toHaveBeenCalledOnce();
  });
});
