import { describe, expect, it } from "vitest";
import {
  isOwnerEditCloseoutMode,
  normalizeCloseoutSubmitMode,
} from "./closeout-submit-mode";

describe("normalizeCloseoutSubmitMode", () => {
  it.each([
    ["submit", "submit"],
    ["ownerEdit", "ownerEdit"],
    ["resubmit", "ownerEdit"],
    [undefined, "submit"],
    ["legacy", "submit"],
  ] as const)("maps %s to %s", (input, expected) => {
    expect(normalizeCloseoutSubmitMode(input)).toBe(expected);
  });
});

describe("isOwnerEditCloseoutMode", () => {
  it("is true only for ownerEdit", () => {
    expect(isOwnerEditCloseoutMode("ownerEdit")).toBe(true);
    expect(isOwnerEditCloseoutMode("submit")).toBe(false);
  });
});
