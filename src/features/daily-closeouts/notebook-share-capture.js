/** Capture a notebook share preview DOM node to PNG (same pipeline as owner home share). */

export async function captureNotebookShareBlob(element, backgroundColor = "#FFFDF7") {
  if (!element) throw new Error("missing-preview");
  const { toBlob } = await import("html-to-image");
  if (document.fonts?.ready) await document.fonts.ready;
  const width = 390;
  const naturalHeight = Math.max(element.scrollHeight, element.offsetHeight, 200);
  const height = Math.min(naturalHeight, 6000);

  const blob = await toBlob(element, {
    cacheBust: true,
    pixelRatio: Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.4),
    backgroundColor,
    width,
    height,
    skipAutoScale: true,
    // Cloned nodes inherit hidden/off-screen styles; force full opacity so PNG is not blank.
    style: { opacity: "1", visibility: "visible", fontFamily: "inherit" },
  });
  if (!blob) throw new Error("capture-empty");
  return blob;
}
