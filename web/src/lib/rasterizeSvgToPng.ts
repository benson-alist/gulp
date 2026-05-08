/**
 * Draw an inline SVG to a bitmap using the browser canvas (for uploading
 * through ``POST /uploads/image``).
 *
 * @param svg   A connected SVG element whose outer width/height match the
 *              desired pixel dimensions (or set them before calling).
 * @param pixelWidth   Output canvas width (default 800).
 * @param pixelHeight  Output canvas height (default 640 — 5:4 to match cards).
 * @returns PNG bytes suitable for a {@link File} / {@link FormData} upload.
 */
export async function rasterizeSvgToPng(
  svg: SVGSVGElement,
  pixelWidth = 800,
  pixelHeight = 640,
): Promise<Blob> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(pixelWidth));
  clone.setAttribute("height", String(pixelHeight));

  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("SVG failed to decode for raster."));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable.");

    ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
    const out = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob failed"))),
        "image/png",
      );
    });
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}
