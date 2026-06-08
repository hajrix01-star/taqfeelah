import { describe, expect, it } from "vitest";
import { resolveSubmitCloseoutId } from "./resolve-submit-closeout-id";

describe("resolveSubmitCloseoutId", () => {
  it("reuses a trimmed client closeout id", () => {
    expect(resolveSubmitCloseoutId("  dc-123  ", () => "generated")).toBe("dc-123");
  });

  it("generates a server id when closeout id is missing", () => {
    expect(resolveSubmitCloseoutId(undefined, () => "uuid-1")).toBe("uuid-1");
    expect(resolveSubmitCloseoutId("   ", () => "uuid-2")).toBe("uuid-2");
  });
});
