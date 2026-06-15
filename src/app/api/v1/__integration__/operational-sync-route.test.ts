import { describe, expect, it, beforeEach } from "vitest";
import { setupRouteIntegrationEnv, ownerRequest } from "./helpers";

describe("operational events stream route", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
  });

  it("GET returns text/event-stream content type", async () => {
    const { GET } = await import("@/app/api/v1/operational-events/stream/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/operational-events/stream"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
  });
});
