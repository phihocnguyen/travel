import type { Metadata } from "next";
import MapAvailability from "@/components/map/MapAvailability";

export const metadata: Metadata = {
  title: "Bản đồ tương tác · Vị Xoài Dẫn Lối",
  description:
    "Khám phá bản đồ 3D Đồng Tháp, các điểm đến miệt vườn và hành trình Trạm Hẹn Cao Lãnh.",
  openGraph: { title: "Bản đồ 3D Cao Lãnh · Vị Xoài Dẫn Lối", description: "Khám phá điểm đến, miệt vườn và địa danh Cao Lãnh trên bản đồ tương tác.", images: [{ url: "/cao-lanh-orchard.jpg", width: 1200, height: 675, alt: "Vườn xoài Cao Lãnh" }] },
};

export default function MapPage() {
  return (
    <main className="relative min-h-dvh w-full bg-cream">
      <MapAvailability />
    </main>
  );
}
