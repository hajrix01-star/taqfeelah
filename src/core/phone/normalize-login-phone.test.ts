import { describe, expect, it } from "vitest";
import { assertValidLoginPhone, normalizeLoginPhone } from "@/core/phone/normalize-login-phone";

describe("normalizeLoginPhone", () => {
  it("normalizes local Saudi mobile", () => {
    expect(normalizeLoginPhone("0501234567")).toBe("+966501234567");
  });

  it("keeps E.164", () => {
    expect(normalizeLoginPhone("+966501234567")).toBe("+966501234567");
  });

  it("assertValidLoginPhone rejects invalid", () => {
    expect(() => assertValidLoginPhone("123")).toThrow();
  });
});
