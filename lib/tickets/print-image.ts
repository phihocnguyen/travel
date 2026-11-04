import "server-only";
import sharp from "sharp";
import { PRINT_WIDTH, PRINT_HEIGHT, PRINT_DPI, MAX_PRINT_BYTES } from "./print-settings";

/** Validate source resolution before processing; never disguise a thumbnail by upscaling it. */
export async function colorPrintPng(source: Buffer): Promise<Buffer> {
  if (!source.length || source.length > MAX_PRINT_BYTES) throw new Error("PRINT_FILE_SIZE");
  const metadata = await sharp(source, { limitInputPixels: 40_000_000 }).metadata();
  if (metadata.format !== "png") throw new Error("PRINT_FILE_FORMAT");
  if (!metadata.width || !metadata.height || metadata.width < PRINT_WIDTH || metadata.height < PRINT_HEIGHT) throw new Error("PRINT_RESOLUTION_TOO_LOW");
  if (Math.abs(metadata.width / metadata.height - PRINT_WIDTH / PRINT_HEIGHT) > 0.005) throw new Error("PRINT_ASPECT_RATIO");
  return sharp(source, { limitInputPixels: 40_000_000 })
    .resize(PRINT_WIDTH, PRINT_HEIGHT, { fit: "fill", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .withMetadata({ density: PRINT_DPI })
    .toColourspace("srgb")
    .png({ compressionLevel: 9 })
    .toBuffer();
}
