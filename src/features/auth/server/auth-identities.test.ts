import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword, verifyPassword } from "@/features/auth/server/password-hash";

const selectChain = {
  from: vi.fn(),
};

const dbMock = {
  select: vi.fn(() => selectChain),
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(async () => [{ id: "identity-new" }]),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(async () => undefined),
    })),
  })),
};

vi.mock("@/core/db/client", () => ({
  getDb: () => dbMock,
}));

describe("auth-identities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectChain.from.mockReturnValue({
      where: vi.fn(() => ({
        limit: vi.fn(async () => []),
      })),
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("hashes and verifies owner password round-trip", async () => {
    const stored = await hashPassword("secret-123");
    expect(await verifyPassword("secret-123", stored)).toBe(true);
    expect(await verifyPassword("wrong", stored)).toBe(false);
  });

  it("creates owner password identity when none exists", async () => {
    const { upsertOwnerPasswordIdentity } = await import("./auth-identities");
    const result = await upsertOwnerPasswordIdentity({
      userId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      username: "Owner",
      password: "secret-12",
    });
    expect(result.provider).toBe("username_password");
    expect(dbMock.insert).toHaveBeenCalled();
  });

  it("updates owner password identity when one exists", async () => {
    selectChain.from.mockReturnValue({
      where: vi.fn(() => ({
        limit: vi.fn(async () => [{ id: "identity-existing" }]),
      })),
    });
    const { upsertOwnerPasswordIdentity } = await import("./auth-identities");
    const result = await upsertOwnerPasswordIdentity({
      userId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      username: "owner",
      password: "new-secret",
    });
    expect(result.id).toBe("identity-existing");
    expect(dbMock.update).toHaveBeenCalled();
  });
});
