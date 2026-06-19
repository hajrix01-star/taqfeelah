import { describe, expect, it } from "vitest";
import {
  assertEmailLoginIdentifier,
  isEmailLoginIdentifier,
  normalizeEmailLoginIdentifier,
} from "@/core/auth/email-login-identifier";

describe("email login identifier", () => {
  it("accepts normalized email addresses", () => {
    expect(normalizeEmailLoginIdentifier("  Admin@Example.COM ")).toBe("admin@example.com");
    expect(isEmailLoginIdentifier("admin@example.com")).toBe(true);
    expect(assertEmailLoginIdentifier("admin@example.com")).toBe("admin@example.com");
  });

  it("rejects legacy usernames without @", () => {
    expect(isEmailLoginIdentifier("hajri")).toBe(false);
    expect(isEmailLoginIdentifier("q")).toBe(false);
    expect(() => assertEmailLoginIdentifier("hajri")).toThrow();
  });
});
