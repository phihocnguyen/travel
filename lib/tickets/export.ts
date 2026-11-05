"use client";
import { toPng } from "html-to-image";
import { PRINT_WIDTH, PRINT_HEIGHT, PRINT_DPI } from "./print-settings";
import { pngWithDensity } from "./png-density";

export async function ticketPng(element: HTMLElement): Promise<string> {
  await document.fonts.ready;
  const url = await toPng(element, {
    // Rasterize the SVG/DOM at a fixed print canvas, including on narrow screens.
    canvasWidth: PRINT_WIDTH, canvasHeight: PRINT_HEIGHT, pixelRatio: 1,
    backgroundColor: "#ffffff", cacheBust: false,
    preferredFontFormat: "woff2",
    filter: (node) => !(node instanceof HTMLElement && node.hasAttribute("data-export-ignore")),
  });
  const source = Uint8Array.from(atob(url.split(",")[1]), char => char.charCodeAt(0));
  const output = pngWithDensity(source, PRINT_DPI);
  // Encode in chunks to avoid spreading a large PNG onto the call stack.
  const parts: string[] = [];
  for (let offset = 0; offset < output.length; offset += 8192) {
    parts.push(String.fromCharCode(...output.subarray(offset, offset + 8192)));
  }
  return `data:image/png;base64,${btoa(parts.join(""))}`;
}
export function downloadTicket(url: string, code: string) {
  const link = document.createElement("a"); link.href = url; link.download = `${code}.png`; link.click();
}
