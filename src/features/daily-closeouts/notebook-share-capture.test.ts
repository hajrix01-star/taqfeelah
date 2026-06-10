import { describe, expect, it } from "vitest";
import {
  NOTEBOOK_SHARE_MAX_OUTPUT_DIMENSION_PX,
  NOTEBOOK_SHARE_MAX_PIXEL_RATIO,
  NOTEBOOK_SHARE_TARGET_PIXEL_RATIO,
  resolveNotebookShareCaptureMetrics,
} from "./notebook-share-capture";

describe("resolveNotebookShareCaptureMetrics", () => {
  it("upscales narrow mobile previews to at least 1080px output width", () => {
    const metrics = resolveNotebookShareCaptureMetrics(360, 920);

    expect(metrics.width).toBe(360);
    expect(metrics.height).toBe(920);
    expect(metrics.pixelRatio).toBe(3);
    expect(metrics.outputWidth).toBe(1080);
    expect(metrics.outputHeight).toBe(2760);
  });

  it("keeps the target pixel ratio on wider previews when already above min export width", () => {
    const metrics = resolveNotebookShareCaptureMetrics(700, 800);

    expect(metrics.pixelRatio).toBe(NOTEBOOK_SHARE_TARGET_PIXEL_RATIO);
    expect(metrics.outputWidth).toBe(1400);
    expect(metrics.outputHeight).toBe(1600);
  });

  it("caps pixel ratio at the configured maximum", () => {
    const metrics = resolveNotebookShareCaptureMetrics(280, 600, {
      minExportWidthPx: 1200,
      maxPixelRatio: NOTEBOOK_SHARE_MAX_PIXEL_RATIO,
    });

    expect(metrics.pixelRatio).toBe(NOTEBOOK_SHARE_MAX_PIXEL_RATIO);
    expect(metrics.outputWidth).toBe(840);
  });

  it("reduces pixel ratio when output would exceed the dimension ceiling", () => {
    const metrics = resolveNotebookShareCaptureMetrics(360, 5000, {
      maxOutputDimensionPx: NOTEBOOK_SHARE_MAX_OUTPUT_DIMENSION_PX,
    });

    expect(metrics.outputHeight).toBeLessThanOrEqual(NOTEBOOK_SHARE_MAX_OUTPUT_DIMENSION_PX);
    expect(metrics.outputWidth).toBeLessThanOrEqual(NOTEBOOK_SHARE_MAX_OUTPUT_DIMENSION_PX);
    expect(metrics.pixelRatio).toBeLessThan(NOTEBOOK_SHARE_MAX_PIXEL_RATIO);
  });

  it("preserves preview css dimensions without widening layout", () => {
    const metrics = resolveNotebookShareCaptureMetrics(342.4, 811.9);

    expect(metrics.width).toBe(343);
    expect(metrics.height).toBe(812);
  });
});
