import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/v1/auth/signup/status/route";

describe("signup status route", () => {
  it("returns disabled when public signup is off", async () => {
    const previous = process.env.AUTH_PUBLIC_SIGNUP_ENABLED;
    delete process.env.AUTH_PUBLIC_SIGNUP_ENABLED;
    try {
      const response = await GET();
      const payload = await response.json();
      expect(payload.enabled).toBe(false);
    } finally {
      if (previous) process.env.AUTH_PUBLIC_SIGNUP_ENABLED = previous;
    }
  });
});
