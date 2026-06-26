import { afterEach, describe, expect, it } from "vitest";
import { getReleaseMeta, releaseLabelFromVersion } from "@/release/version";

describe("releaseLabelFromVersion", () => {
  it("derives major release labels", () => {
    expect(releaseLabelFromVersion("1.0.0")).toBe("V1");
    expect(releaseLabelFromVersion("2.3.4")).toBe("V2");
  });
});

describe("getReleaseMeta", () => {
  const previous = { ...process.env };

  afterEach(() => {
    process.env = { ...previous };
  });

  it("reads unified release env values", () => {
    process.env.RELEASE_VERSION = "1.0.0";
    process.env.RELEASE_LABEL = "V1";
    process.env.RELEASE_BUILD = "commit123";

    expect(getReleaseMeta()).toEqual({
      version: "1.0.0",
      label: "V1",
      build: "commit123",
    });
  });

  it("keeps explicit runtime labels with spaces", () => {
    process.env.RELEASE_VERSION = "2.0.0";
    process.env.RELEASE_LABEL = "نسخة مرحلة 4";
    process.env.RELEASE_BUILD = "commit456";

    expect(getReleaseMeta()).toEqual({
      version: "2.0.0",
      label: "نسخة مرحلة 4",
      build: "commit456",
    });
  });
});
