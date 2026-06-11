import { describe, expect, it } from "vitest";
import { isReleaseUpdateAvailable } from "@/release/check-update-available";

describe("isReleaseUpdateAvailable", () => {
  it("returns false when builds match", () => {
    expect(isReleaseUpdateAvailable("abc123", "abc123")).toBe(false);
  });

  it("returns true when server build differs from client build", () => {
    expect(isReleaseUpdateAvailable("abc123", "def456")).toBe(true);
  });

  it("returns false for dev builds", () => {
    expect(isReleaseUpdateAvailable("dev", "abc123")).toBe(false);
    expect(isReleaseUpdateAvailable("abc123", "dev")).toBe(false);
  });

  it("returns false when server build is missing", () => {
    expect(isReleaseUpdateAvailable("abc123", null)).toBe(false);
    expect(isReleaseUpdateAvailable("abc123", undefined)).toBe(false);
  });
});
