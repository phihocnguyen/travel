import type { Metadata } from "next";
import MapExperience from "@/components/map/MapExperience";

export const metadata: Metadata = {
  title: "Bản đồ tương tác · Vị Xoài Dẫn Lối",
  description:
    "Khám phá bản đồ 3D Đồng Tháp, các điểm đến miệt vườn và hành trình Trạm Hẹn Cao Lãnh.",
};

export default function MapPage() {
  return (
    <main className="relative min-h-dvh w-full bg-cream">
      <MapExperience />
    </main>
  );
}
