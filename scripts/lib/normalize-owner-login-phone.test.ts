import { describe, expect, it } from "vitest";
import { normalizeOptionalOwnerLoginPhone } from "./normalize-owner-login-phone.mjs";

describe("normalizeOptionalOwnerLoginPhone", () => {
  it("accepts a Saudi E.164 mobile", () => {
    expect(normalizeOptionalOwnerLoginPhone(" +966500000001 ")).toBe("+966500000001");
  });

  it("keeps the optional value empty", () => {
    expect(normalizeOptionalOwnerLoginPhone("")).toBeNull();
  });

  it("rejects local or malformed values", () => {
    expect(() => normalizeOptionalOwnerLoginPhone("0500000001")).toThrow(/Saudi E\.164/);
    expect(() => normalizeOptionalOwnerLoginPhone("+966400000001")).toThrow(/Saudi E\.164/);
  });
});
