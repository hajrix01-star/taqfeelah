import { describe, expect, it } from "vitest";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "@/features/auth/server/password-reset-token";

describe("password reset token helpers", () => {
  it("hashes tokens deterministically", () => {
    const token = "sample-token";
    expect(hashPasswordResetToken(token)).toBe(hashPasswordResetToken(token));
  });

  it("generates unique tokens", () => {
    const first = generatePasswordResetToken();
    const second = generatePasswordResetToken();
    expect(first).not.toBe(second);
  });
});
