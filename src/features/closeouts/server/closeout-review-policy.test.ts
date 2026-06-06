import { describe, expect, it } from "vitest";
import { resolveCloseoutAutoReview } from "./closeout-review-policy";

describe("resolveCloseoutAutoReview", () => {
  it("requires employee review when store closeout review is enabled", () => {
    expect(resolveCloseoutAutoReview({
      actorRole: "employee",
      closeoutReviewEnabled: true,
      autoReview: true,
    })).toBe(false);
  });

  it("auto-approves employee closeouts when store review is disabled", () => {
    expect(resolveCloseoutAutoReview({
      actorRole: "employee",
      closeoutReviewEnabled: false,
      autoReview: false,
    })).toBe(true);
  });

  it("keeps owner auto-review controlled by autoReview flag", () => {
    expect(resolveCloseoutAutoReview({
      actorRole: "owner",
      closeoutReviewEnabled: true,
      autoReview: true,
    })).toBe(true);
    expect(resolveCloseoutAutoReview({
      actorRole: "owner",
      closeoutReviewEnabled: false,
      autoReview: false,
    })).toBe(false);
  });
});
