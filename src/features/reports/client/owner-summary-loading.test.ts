import { describe, expect, it } from "vitest";
import { isOwnerApiSummaryPending } from "./owner-summary-loading";

describe("isOwnerApiSummaryPending", () => {
  it("returns true while API summary is loading without cached data", () => {
    expect(isOwnerApiSummaryPending({
      apiEnabled: true,
      preferEntrySummaries: false,
      loading: true,
      loaded: false,
      hasData: false,
      loadFailed: false,
    })).toBe(true);
  });

  it("returns false when cached API data is available during refresh", () => {
    expect(isOwnerApiSummaryPending({
      apiEnabled: true,
      preferEntrySummaries: false,
      loading: true,
      loaded: true,
      hasData: true,
      loadFailed: false,
    })).toBe(false);
  });

  it("returns false when entry summaries are preferred", () => {
    expect(isOwnerApiSummaryPending({
      apiEnabled: true,
      preferEntrySummaries: true,
      loading: true,
      loaded: false,
      hasData: false,
      loadFailed: false,
    })).toBe(false);
  });
});
