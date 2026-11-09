"use client";
import { toPng } from "html-to-image";
import { PRINT_WIDTH, PRINT_HEIGHT, PRINT_DPI } from "./print-settings";
import { pngWithDensity } from "./png-density";

export async function ticketPng(element: HTMLElement): Promise<string> {
  await document.fonts.ready;
  // Lay out at export resolution first. Scaling a small preview also scales its
  // rasterized text and depends on the editor's viewport/container dimensions.
  const width = PRINT_WIDTH * 2, height = PRINT_HEIGHT * 2;
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-100000px;top:0;pointer-events:none;";
  const clone = element.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, { width: `${width}px`, height: `${height}px`, maxWidth: "none", maxHeight: "none", aspectRatio: "auto", borderRadius: "0", boxShadow: "none", transform: "none" });
  host.appendChild(clone);
  document.body.appendChild(host);
  let url: string;
  try {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    url = await toPng(clone, {
    width, height, canvasWidth: width, canvasHeight: height, pixelRatio: 1,
    backgroundColor: "#ffffff", cacheBust: false,
    preferredFontFormat: "woff2",
    filter: (node) => !(node instanceof HTMLElement && node.hasAttribute("data-export-ignore")),
    });
  } finally {
    host.remove();
  }
  const source = Uint8Array.from(atob(url.split(",")[1]), char => char.charCodeAt(0));
  const output = pngWithDensity(source, PRINT_DPI * 2);
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
