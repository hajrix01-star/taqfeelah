/** Capture a notebook share preview DOM node to PNG (same pipeline as owner home share). */

/** Minimum output bitmap width — upscale via pixelRatio only; on-screen preview stays unchanged. */
export const NOTEBOOK_SHARE_MIN_EXPORT_WIDTH_PX = 1080;

/** Default rasterization scale when memory allows. */
export const NOTEBOOK_SHARE_TARGET_PIXEL_RATIO = 2;

/** Upper bound to avoid runaway memory use on narrow/tall captures. */
export const NOTEBOOK_SHARE_MAX_PIXEL_RATIO = 3;

/** Canvas/output dimension ceiling (common mobile GPU limit). */
export const NOTEBOOK_SHARE_MAX_OUTPUT_DIMENSION_PX = 8192;

/** CSS height ceiling before rasterization. */
export const NOTEBOOK_SHARE_MAX_CSS_HEIGHT = 6000;

/**
 * Derive capture rasterization from the rendered preview size.
 * Upscales export only (pixelRatio); CSS layout width/height match the live preview.
 *
 * @param {number} cssWidth
 * @param {number} cssHeight
 * @param {{
 *   minExportWidthPx?: number;
 *   targetPixelRatio?: number;
 *   maxPixelRatio?: number;
 *   maxOutputDimensionPx?: number;
 * }} [options]
 */
export function resolveNotebookShareCaptureMetrics(cssWidth, cssHeight, options = {}) {
  const minExportWidthPx = options.minExportWidthPx ?? NOTEBOOK_SHARE_MIN_EXPORT_WIDTH_PX;
  const targetPixelRatio = options.targetPixelRatio ?? NOTEBOOK_SHARE_TARGET_PIXEL_RATIO;
  const maxPixelRatio = options.maxPixelRatio ?? NOTEBOOK_SHARE_MAX_PIXEL_RATIO;
  const maxOutputDimensionPx = options.maxOutputDimensionPx ?? NOTEBOOK_SHARE_MAX_OUTPUT_DIMENSION_PX;

  const width = Math.max(1, Math.ceil(cssWidth));
  const height = Math.max(1, Math.ceil(cssHeight));

  let pixelRatio = Math.max(targetPixelRatio, minExportWidthPx / width);
  pixelRatio = Math.min(maxPixelRatio, pixelRatio);

  const ratioCapByWidth = maxOutputDimensionPx / width;
  const ratioCapByHeight = maxOutputDimensionPx / height;
  pixelRatio = Math.min(pixelRatio, ratioCapByWidth, ratioCapByHeight);

  if (pixelRatio < targetPixelRatio && ratioCapByWidth >= targetPixelRatio && ratioCapByHeight >= targetPixelRatio) {
    pixelRatio = targetPixelRatio;
  }

  return {
    width,
    height,
    pixelRatio,
    outputWidth: Math.round(width * pixelRatio),
    outputHeight: Math.round(height * pixelRatio),
  };
}

function readPreviewCssSize(element) {
  const rect = element.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(rect.width || element.scrollWidth || element.offsetWidth || 390));
  const naturalHeight = Math.max(Math.ceil(rect.height || 0), element.scrollHeight, element.offsetHeight, 200);
  const height = Math.min(naturalHeight, NOTEBOOK_SHARE_MAX_CSS_HEIGHT);
  return { width, height };
}

export async function captureNotebookShareBlob(element, backgroundColor = "#FFFDF7") {
  if (!element) throw new Error("missing-preview");
  const { toBlob } = await import("html-to-image");
  if (document.fonts?.ready) await document.fonts.ready;

  const { width, height } = readPreviewCssSize(element);
  const { pixelRatio } = resolveNotebookShareCaptureMetrics(width, height);

  const blob = await toBlob(element, {
    cacheBust: true,
    pixelRatio,
    backgroundColor,
    width,
    height,
    skipAutoScale: true,
    // Cloned nodes inherit hidden/off-screen styles; force full opacity so PNG is not blank.
    style: {
      opacity: "1",
      visibility: "visible",
      fontFamily: "inherit",
      width: `${width}px`,
      maxWidth: `${width}px`,
    },
  });
  if (!blob) throw new Error("capture-empty");
  return blob;
}
