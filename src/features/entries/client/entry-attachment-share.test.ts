import { describe, expect, it } from "vitest";
import { dataUrlToShareFile } from "./entry-attachment-share";

describe("dataUrlToShareFile", () => {
  it("decodes data URLs synchronously without fetch", async () => {
    const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const dataUrl = `data:image/png;base64,${pngBase64}`;
    const file = await dataUrlToShareFile(dataUrl, "invoice-1");
    expect(file.type).toBe("image/png");
    expect(file.name).toBe("invoice-1.png");
    expect(file.size).toBeGreaterThan(0);
  });
});
