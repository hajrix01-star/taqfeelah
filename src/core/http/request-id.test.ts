import { describe, expect, it } from "vitest";
import { resolveRequestId } from "./request-id";

describe("resolveRequestId", () => {
  it("reuses x-request-id when provided", () => {
    const request = new Request("http://localhost/api", {
      headers: { "x-request-id": "req-123" },
    });
    expect(resolveRequestId(request)).toBe("req-123");
  });

  it("generates a request id when header is missing", () => {
    const request = new Request("http://localhost/api");
    const requestId = resolveRequestId(request);
    expect(requestId.length).toBeGreaterThan(8);
  });
});
