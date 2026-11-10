import type { Metadata } from "next";
import TravelChatbot from "@/components/chat/TravelChatbot";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "VỊ XOÀI DẪN LỐI · Theo vị xoài Cát, mở lối chu du",
  description:
    "Chiến dịch du lịch trải nghiệm Cao Lãnh, Đồng Tháp dành cho người trẻ 18–24 tuổi tại TP. Hồ Chí Minh. Khám phá Trạm Hẹn Cao Lãnh và tạo Vé Hẹn Chu Du.",
  openGraph: { title: "VỊ XOÀI DẪN LỐI · Theo vị xoài Cát, mở lối chu du", description: "Khám phá Cao Lãnh, Đồng Tháp cùng Trạm Hẹn Cao Lãnh.", images: [{ url: "/banner.jpg", width: 2034, height: 773, alt: "Vị Xoài Dẫn Lối · Trạm Hẹn Cao Lãnh" }] },
};

export default function Home() {
  return <><LandingPage /><TravelChatbot /></>;
}
