import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import SiteCursor from "@/components/effects/SiteCursor";
import UserPresence from "@/components/auth/UserPresence";
import "./globals.css";

const khaviax = localFont({
  src: "./fonts/Khaviax.ttf",
  variable: "--font-khaviax",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "VỊ XOÀI DẪN LỐI · Trạm Hẹn Cao Lãnh",
  description:
    "Theo vị xoài Cát, mở lối chu du — chiến dịch du lịch trải nghiệm Cao Lãnh, Đồng Tháp và sự kiện Trạm Hẹn Cao Lãnh ngày 21/11/2026 tại TP. Hồ Chí Minh.",
};

export const viewport: Viewport = {
  themeColor: "#fefbdf",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${khaviax.variable} h-full antialiased`}>
      <body className="min-h-full">{children}<Suspense fallback={null}><SiteCursor/><UserPresence/></Suspense></body>
    </html>
  );
}
