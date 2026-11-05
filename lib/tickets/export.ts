"use client";
import { toPng } from "html-to-image";
import { PRINT_WIDTH, PRINT_HEIGHT } from "./print-settings";

export async function ticketPng(element: HTMLElement): Promise<string> {
  await document.fonts.ready;
  return toPng(element, {
    // Rasterize the SVG/DOM at a fixed print canvas, including on narrow screens.
    canvasWidth: PRINT_WIDTH, canvasHeight: PRINT_HEIGHT, pixelRatio: 1,
    backgroundColor: "#ffffff", cacheBust: false,
    preferredFontFormat: "woff2",
    filter: (node) => !(node instanceof HTMLElement && node.hasAttribute("data-export-ignore")),
  });
}
export function downloadTicket(url: string, code: string) {
  const link = document.createElement("a"); link.href = url; link.download = `${code}.png`; link.click();
}
