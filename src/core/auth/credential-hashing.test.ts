import { describe, expect, it } from "vitest";
import {
  ensureHashed,
  hashCredential,
  isHashedCredential,
  verifyCredential,
} from "@/core/auth/credential-hashing";

describe("credential-hashing", () => {
  it("produces a scrypt hash for plaintext", async () => {
    const hash = await hashCredential("mysecret");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(isHashedCredential(hash)).toBe(true);
  });

  it("verifies a correct plaintext against scrypt hash", async () => {
    const hash = await hashCredential("mysecret");
    expect(await verifyCredential("mysecret", hash)).toBe(true);
  });

  it("rejects an incorrect plaintext against scrypt hash", async () => {
    const hash = await hashCredential("mysecret");
    expect(await verifyCredential("wrong", hash)).toBe(false);
  });

  it("falls back to plaintext comparison for legacy values", async () => {
    expect(await verifyCredential("123", "123")).toBe(true);
    expect(await verifyCredential("123", "456")).toBe(false);
  });

  it("ensureHashed does not re-hash an already hashed value", async () => {
    const hash = await hashCredential("test");
    const again = await ensureHashed(hash);
    expect(again).toBe(hash);
  });

  it("ensureHashed hashes plaintext", async () => {
    const result = await ensureHashed("plaintext");
    expect(isHashedCredential(result)).toBe(true);
  });

  it("two hashes of same plaintext differ (salt)", async () => {
    const h1 = await hashCredential("same");
    const h2 = await hashCredential("same");
    expect(h1).not.toBe(h2);
  });
});
