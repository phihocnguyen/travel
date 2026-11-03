import { ATTRACTIONS, type AttractionCategory } from "@/lib/map/attractions";
import { CAMPAIGN } from "@/components/campaign/campaignData";

export const CHECKPOINT_COUNT = Math.min(4, ATTRACTIONS.length);

// Spread the story across different marker indices rather than inventing coordinates.
export const JOURNEY_CHECKPOINTS = Array.from({ length: CHECKPOINT_COUNT }, (_, i) => {
  const index = CHECKPOINT_COUNT === 1
    ? 0
    : Math.round((i * (ATTRACTIONS.length - 1)) / (CHECKPOINT_COUNT - 1));
  return { index, attraction: ATTRACTIONS[index] };
});

const CATEGORY_LABELS: Record<AttractionCategory, string> = {
  Ecology: "Sinh thái",
  Heritage: "Di sản",
  Culture: "Văn hóa",
  Coast: "Biển",
};

// Short, concrete checkpoint copy for the places shown in the journey.
const CHECKPOINT_DESCRIPTIONS: Record<number, string> = {
  0: "Mùa khô, nước rút để lộ những bãi cỏ rộng và chim về kiếm ăn. Nếu có thời gian, thử đi thuyền vào vùng lõi để ngắm cảnh đồng nước.",
  5: "Ở Tân Quy Đông, vườn hoa nằm san sát dọc bờ sông Tiền. Những tuần cận Tết là lúc làng hoa nhộn nhịp và nhiều màu sắc nhất.",
  9: "Chùa có cổng tam quan, chánh điện và nhiều pho tượng lớn giữa khu vườn rợp bóng. Buổi sáng thường yên hơn để thong thả đi một vòng.",
  14: "Ngôi chùa người Hoa ở trung tâm Sa Đéc, dễ nhận ra bởi mái ngói uốn cong và các hình chạm rồng phượng. Nhà cổ Huỳnh Thủy Lê ở gần đó, tiện ghé cùng chuyến.",
};

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
    eyebrow: `${CAMPAIGN.name} · CAO LÃNH, ĐỒNG THÁP`,
    title: "Theo vị xoài Cát,",
    emphasis: "mở lối chu du.",
    description: CAMPAIGN.description,
    position: "center",
  },
  ...JOURNEY_CHECKPOINTS.map(({ attraction }, i): JourneyChapter => ({
    index: String(i + 1).padStart(2, "0"),
    eyebrow: `TRẠM ${String(i + 1).padStart(2, "0")} / ${CATEGORY_LABELS[attraction.category]}`,
    title: "Khám phá",
    emphasis: attraction.name,
    description: CHECKPOINT_DESCRIPTIONS[attraction.id] ?? attraction.summary,
    position: i % 2 === 0 ? "left" : "right",
  })),
];
