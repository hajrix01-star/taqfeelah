import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import {
  PWA_APP_NAME,
  PWA_FORGOT_PASSWORD_URL,
  PWA_MANIFEST_ID,
  PWA_OFFLINE_URL,
  PWA_START_URL,
  PWA_THEME_COLOR,
} from "./pwa";

describe("pwa config", () => {
  it("exposes install metadata constants", () => {
    expect(PWA_APP_NAME).toBe("تقفيلة");
    expect(PWA_START_URL).toBe("/app");
    expect(PWA_OFFLINE_URL).toBe("/~offline");
    expect(PWA_THEME_COLOR).toBe("#F8F6F0");
    expect(PWA_MANIFEST_ID).toBe("/");
  });

  it("uses brand tagline for install description", () => {
    const value = manifest();
    expect(value.description).toBe("حسبة بدو، لا تعقدها");
    expect(value.screenshots?.every((item) => item.label === "حسبة بدو، لا تعقدها")).toBe(true);
  });

  it("generates a manifest with required install fields", () => {
    const value = manifest();

    expect(value.id).toBe("/");
    expect(value.name).toBe("تقفيلة");
    expect(value.start_url).toBe("/app");
    expect(value.display).toBe("standalone");
    expect(value.icons?.length).toBeGreaterThanOrEqual(4);
    expect(value.icons?.some((icon) => icon.sizes === "192x192")).toBe(true);
    expect(value.icons?.some((icon) => icon.sizes === "512x512")).toBe(true);
    expect(value.screenshots?.length).toBeGreaterThanOrEqual(2);
    expect(value.shortcuts?.length).toBeGreaterThanOrEqual(2);
    expect(value.shortcuts?.[0]?.url).toBe("/app");
    expect(value.shortcuts?.[1]?.url).toBe(PWA_FORGOT_PASSWORD_URL);
  });
});
