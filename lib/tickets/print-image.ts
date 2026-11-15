import "server-only";
import sharp from "sharp";
import { PRINT_WIDTH, PRINT_HEIGHT, PRINT_DPI, MAX_PRINT_BYTES, TICKET_PAPER_WIDTH_MM } from "./print-settings";

/** Validate source resolution before processing; never disguise a thumbnail by upscaling it. */
export async function colorPrintPng(source: Buffer): Promise<Buffer> {
  if (!source.length || source.length > MAX_PRINT_BYTES) throw new Error("PRINT_FILE_SIZE");
  const metadata = await sharp(source, { limitInputPixels: 40_000_000 }).metadata();
  if (metadata.format !== "png") throw new Error("PRINT_FILE_FORMAT");
  if (!metadata.width || !metadata.height || metadata.width < PRINT_WIDTH || metadata.height < PRINT_HEIGHT) throw new Error("PRINT_RESOLUTION_TOO_LOW");
  if (Math.abs(metadata.width / metadata.height - PRINT_WIDTH / PRINT_HEIGHT) > 0.005) throw new Error("PRINT_ASPECT_RATIO");
  // The browser exports at twice the minimum dimensions. Keep enough pixels
  // for 300 DPI at the full 21 cm print width instead of downsampling early.
  const printWidth = Math.round(TICKET_PAPER_WIDTH_MM / 25.4 * PRINT_DPI);
  const width = Math.min(metadata.width, printWidth);
  const height = Math.round(width * PRINT_HEIGHT / PRINT_WIDTH);
  return sharp(source, { limitInputPixels: 40_000_000 })
    .resize(width, height, { fit: "fill", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .withMetadata({ density: PRINT_DPI })
    .toColourspace("srgb")
    .png({ compressionLevel: 3 })
    .toBuffer();
}
