import { afterEach, describe, expect, it, vi } from "vitest";
import { readPublicEnvString } from "./public-env";

describe("readPublicEnvString", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads via direct process.env for client bundle inlining", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", "org-from-process-env");
    expect(
      readPublicEnvString(
        "NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID",
        process.env as { NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID?: string },
      ),
    ).toBe("org-from-process-env");
  });

  it("honors explicit custom env overrides", () => {
    vi.stubEnv("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", "ignored");
    expect(
      readPublicEnvString("NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID", {
        NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID: "org-from-custom-env",
      }),
    ).toBe("org-from-custom-env");
  });
});
