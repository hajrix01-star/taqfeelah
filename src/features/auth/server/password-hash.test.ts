import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password-hash";

describe("password hash", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("secret-123");
    expect(hash.startsWith("scrypt:v1:")).toBe(true);
    expect(await verifyPassword("secret-123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
