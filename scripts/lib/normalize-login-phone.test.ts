import { describe, expect, it } from "vitest";
import { normalizeOptionalLoginPhone } from "./normalize-login-phone.mjs";

describe("normalizeOptionalLoginPhone", () => {
  it("accepts a Saudi E.164 mobile", () => {
    expect(normalizeOptionalLoginPhone(" +966500000001 ")).toBe("+966500000001");
  });

  it("keeps the optional value empty", () => {
    expect(normalizeOptionalLoginPhone("")).toBeNull();
  });

  it("rejects local or malformed values", () => {
    expect(() => normalizeOptionalLoginPhone("0500000001")).toThrow(/Saudi E\.164/);
    expect(() => normalizeOptionalLoginPhone("+966400000001")).toThrow(/Saudi E\.164/);
  });
});
