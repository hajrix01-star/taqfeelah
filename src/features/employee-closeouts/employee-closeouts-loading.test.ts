import { describe, expect, it } from "vitest";
import {
  isEmployeeCloseoutsListPending,
  isEmployeeCloseoutsRefreshing,
} from "./employee-closeouts-loading";

describe("isEmployeeCloseoutsListPending", () => {
  it("returns true while closeouts API is loading without cached data", () => {
    expect(isEmployeeCloseoutsListPending({
      apiEnabled: true,
      loading: true,
      loaded: false,
      hasCachedCloseouts: false,
      loadFailed: false,
    })).toBe(true);
  });

  it("returns false when cached closeouts are visible during refresh", () => {
    expect(isEmployeeCloseoutsListPending({
      apiEnabled: true,
      loading: true,
      loaded: true,
      hasCachedCloseouts: true,
      loadFailed: false,
    })).toBe(false);
  });

  it("returns false when API is disabled", () => {
    expect(isEmployeeCloseoutsListPending({
      apiEnabled: false,
      loading: true,
      loaded: false,
      hasCachedCloseouts: false,
      loadFailed: false,
    })).toBe(false);
  });
});

describe("isEmployeeCloseoutsRefreshing", () => {
  it("returns true during background refresh with cached cards", () => {
    expect(isEmployeeCloseoutsRefreshing({
      apiEnabled: true,
      loading: true,
      hasCachedCloseouts: true,
    })).toBe(true);
  });
});
