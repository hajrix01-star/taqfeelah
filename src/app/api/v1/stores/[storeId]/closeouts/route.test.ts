import { describe, expect, it } from "vitest";

describe("closeouts POST route autoReview contract", () => {
  it("passes autoReview=true through for employee role (not owner-only gate)", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(
        new URL("./route.ts", import.meta.url),
        "utf8",
      ),
    );
    expect(source).not.toContain("requestContext.role === \"owner\" || requestContext.role === \"manager\"");
    expect(source).toContain("autoReview: body?.autoReview === true");
  });
});
