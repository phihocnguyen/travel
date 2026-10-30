import { ATTRACTIONS } from "@/lib/map/attractions";

export const CHECKPOINT_COUNT = Math.min(4, ATTRACTIONS.length);

// Spread the story across different marker indices rather than inventing coordinates.
export const JOURNEY_CHECKPOINTS = Array.from({ length: CHECKPOINT_COUNT }, (_, i) => {
  const index = CHECKPOINT_COUNT === 1
    ? 0
    : Math.round((i * (ATTRACTIONS.length - 1)) / (CHECKPOINT_COUNT - 1));
  return { index, attraction: ATTRACTIONS[index] };
});

export type JourneyChapter = {
  index: string;
  eyebrow: string;
  title: string;
  emphasis: string;
  description: string;
  position: "center" | "left" | "right";
};

export const JOURNEY_CHAPTERS: JourneyChapter[] = [
  {
    index: "00",
    eyebrow: "ĐỒNG THÁP / MỘT HÀNH TRÌNH TƯƠNG TÁC",
    title: "Đi qua",
    emphasis: "miền sông nước.",
    description: "Cuộn để camera bay qua từng điểm đến trên bản đồ. Mỗi điểm dừng hé lộ một câu chuyện riêng.",
    position: "center",
  },
  ...JOURNEY_CHECKPOINTS.map(({ attraction }, i): JourneyChapter => ({
    index: String(i + 1).padStart(2, "0"),
    eyebrow: `ĐIỂM DỪNG ${String(i + 1).padStart(2, "0")} / ${attraction.category}`,
    title: "Khám phá",
    emphasis: attraction.name,
    description: `Một điểm đến thuộc nhóm ${attraction.category}. Nội dung giới thiệu chi tiết hiện là template và có thể thay trong journeyData.ts.`,
    position: i % 2 === 0 ? "left" : "right",
  })),
  {
    index: String(CHECKPOINT_COUNT + 1).padStart(2, "0"),
    eyebrow: "TIẾP TỤC HÀNH TRÌNH",
    title: "Tự mình",
    emphasis: "khám phá.",
    description: "Xoay, thu phóng và chọn các marker trên bản đồ để tìm hiểu địa điểm.",
    position: "center",
  },
];
