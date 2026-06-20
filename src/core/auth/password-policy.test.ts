import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, passwordSchema } from "./password-policy";

describe("password-policy", () => {
  it("requires at least MIN_PASSWORD_LENGTH characters", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
  });

  it("rejects passwords over 120 characters", () => {
    expect(passwordSchema.safeParse("a".repeat(121)).success).toBe(false);
  });

  it("trims whitespace before validating length", () => {
    expect(passwordSchema.safeParse("  12345678  ").success).toBe(true);
    expect(passwordSchema.parse("  hajri123  ")).toBe("hajri123");
  });
});
