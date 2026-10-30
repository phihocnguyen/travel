import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Đồng Tháp · Miền sông nước",
  description:
    "Bản đồ cinematic 3D tỉnh Đồng Tháp — hành chính 2025, sông Tiền, sông Hậu và đồng bằng phù sa.",
};

export const viewport: Viewport = {
  themeColor: "#0a1411",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
