import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/v1/meta/route";

describe("GET /api/v1/meta", () => {
  const previous = { ...process.env };

  afterEach(() => {
    process.env = { ...previous };
  });

  it("returns unified release metadata", async () => {
    process.env.RELEASE_VERSION = "1.0.0";
    process.env.RELEASE_LABEL = "V1";
    process.env.RELEASE_BUILD = "abc123def456";

    const response = await GET();
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload).toEqual({
      version: "1.0.0",
      label: "V1",
      build: "abc123def456",
    });
  });
});
