import { describe, expect, it } from "vitest";
import { isPrototypeAccessMode } from "@/core/config/prototype-access-mode";

describe("isPrototypeAccessMode", () => {
  it("is always false after prelaunch cleanup", () => {
    expect(isPrototypeAccessMode()).toBe(false);
  });
});
