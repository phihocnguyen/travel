import { ATTRACTIONS, type AttractionCategory } from "@/lib/map/attractions";
import { CAMPAIGN, EVENT } from "@/components/campaign/campaignData";

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

export type JourneyChapter = {
  index: string;
  eyebrow: string;
  title: string;
  emphasis: string;
  description: string;
  position: "center" | "left" | "right";
  variant?: "campaign" | "event";
  bullets?: readonly string[];
  meta?: readonly { label: string; value: string }[];
  ctaTitle?: string;
  ctaBody?: string;
  cta?: { label: string; href: string };
  note?: string;
};

export const JOURNEY_CHAPTERS: JourneyChapter[] = [
  {
    index: "00",
    eyebrow: `${CAMPAIGN.name} · CAO LÃNH, ĐỒNG THÁP`,
    title: "Theo vị xoài Cát,",
    emphasis: "mở lối chu du.",
    description: CAMPAIGN.description,
    position: "center",
    variant: "campaign",
  },
  ...JOURNEY_CHECKPOINTS.map(({ attraction }, i): JourneyChapter => ({
    index: String(i + 1).padStart(2, "0"),
    eyebrow: `TRẠM ${String(i + 1).padStart(2, "0")} / ${CATEGORY_LABELS[attraction.category]}`,
    title: "Khám phá",
    emphasis: attraction.name,
    description: attraction.summary,
    position: i % 2 === 0 ? "left" : "right",
  })),
  {
    index: String(CHECKPOINT_COUNT + 1).padStart(2, "0"),
    eyebrow: `${EVENT.name} · ${EVENT.tagline.toUpperCase()}`,
    title: "Trạm Hẹn",
    emphasis: "Cao Lãnh.",
    description: EVENT.description,
    position: "center",
    variant: "event",
    bullets: EVENT.highlights,
    meta: EVENT.meta,
    ctaTitle: EVENT.ctaTitle,
    ctaBody: EVENT.ctaBody,
    cta: { label: "Tạo Vé Hẹn Chu Du", href: EVENT.ticketHref },
    note: EVENT.ticketNote,
  },
];
