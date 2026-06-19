import { describe, expect, it, vi } from "vitest";
import { allocateOrganizationAccountNumber } from "./allocate-organization-account-number";

describe("allocateOrganizationAccountNumber", () => {
  it("returns integer from sequence nextval", async () => {
    const executor = {
      execute: vi.fn().mockResolvedValue({ rows: [{ account_number: 100042 }] }),
    };
    await expect(allocateOrganizationAccountNumber(executor)).resolves.toBe(100042);
  });

  it("throws when sequence result is invalid", async () => {
    const executor = {
      execute: vi.fn().mockResolvedValue({ rows: [{ account_number: null }] }),
    };
    await expect(allocateOrganizationAccountNumber(executor)).rejects.toThrow(
      "Failed to allocate organization account number.",
    );
  });
});
