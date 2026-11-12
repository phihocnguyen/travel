import type { Metadata } from "next";
import ExploreGame from "@/components/explore/ExploreGame";

export const metadata: Metadata = {
  title: "Phiêu lưu Cao Lãnh · Vị Xoài Dẫn Lối",
  description: "Bước vào bản đồ pixel, gặp những điểm đến Cao Lãnh và sưu tầm dấu mộc hành trình.",
};

export default function ExplorePage() {
  return <ExploreGame />;
}
