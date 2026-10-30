import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dong Thap · The Waterways",
  description:
    "A cinematic 3D map of Dong Thap province — 2025 administration, the Tien and Hau rivers and the alluvial delta.",
};

export const viewport: Viewport = {
  themeColor: "#0a1411",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
