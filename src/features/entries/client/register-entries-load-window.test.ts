import { describe, expect, it } from "vitest";
import {
  OPERATIONAL_ENTRIES_LEGACY_DAYS,
  OPERATIONAL_ENTRIES_LEGACY_LIMIT,
  OPERATIONAL_ENTRIES_WORKING_DAYS,
  OPERATIONAL_ENTRIES_WORKING_LIMIT,
  resolveOperationalEntriesBulkLoadWindow,
} from "./register-entries-load-window";

describe("register entries load window", () => {
  it("uses the smaller working window when pagination is enabled", () => {
    expect(resolveOperationalEntriesBulkLoadWindow({ paginationEnabled: true })).toEqual({
      lookbackDays: OPERATIONAL_ENTRIES_WORKING_DAYS,
      limit: OPERATIONAL_ENTRIES_WORKING_LIMIT,
    });
  });

  it("uses the legacy bulk window when pagination is disabled", () => {
    expect(resolveOperationalEntriesBulkLoadWindow({ paginationEnabled: false })).toEqual({
      lookbackDays: OPERATIONAL_ENTRIES_LEGACY_DAYS,
      limit: OPERATIONAL_ENTRIES_LEGACY_LIMIT,
    });
  });
});
