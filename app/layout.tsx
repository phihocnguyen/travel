import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import SiteCursor from "@/components/effects/SiteCursor";
import UserPresence from "@/components/auth/UserPresence";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")),
  title: "VỊ XOÀI DẪN LỐI · Trạm Hẹn Cao Lãnh",
  description:
    "Theo vị xoài Cát, mở lối chu du — chiến dịch du lịch trải nghiệm Cao Lãnh, Đồng Tháp và sự kiện Trạm Hẹn Cao Lãnh ngày 17/11/2026 tại Đại học FPT TP. Hồ Chí Minh.",
  openGraph: { type: "website", locale: "vi_VN", siteName: "Vị Xoài Dẫn Lối", title: "VỊ XOÀI DẪN LỐI · Trạm Hẹn Cao Lãnh", description: "Theo vị xoài Cát, mở lối chu du. Khám phá Cao Lãnh, Đồng Tháp và Trạm Hẹn Cao Lãnh.", images: [{ url: "/share-image?v=2", width: 1200, height: 630, alt: "Vị Xoài Dẫn Lối · Trạm Hẹn Cao Lãnh" }] },
  twitter: { card: "summary_large_image", images: ["/share-image?v=2"] },
};

export const viewport: Viewport = {
  themeColor: "#fefbdf",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full" suppressHydrationWarning>{children}<Suspense fallback={null}><SiteCursor/><UserPresence/></Suspense></body>
    </html>
  );
}
