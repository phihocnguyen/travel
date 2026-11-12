import { ATTRACTIONS, type AttractionCategory } from "@/lib/map/attractions";
import { CAMPAIGN } from "@/components/campaign/campaignData";

export const CHECKPOINT_COUNT = Math.min(4, ATTRACTIONS.length);

// Shared arrival/hold timing for camera, marker, card and terrain focus.
export function getJourneyFrame(progress: number) {
  const raw = Math.max(0, Math.min(1, progress)) * CHECKPOINT_COUNT;
  const segment = Math.min(Math.floor(raw), CHECKPOINT_COUNT - 1);
  const phase = raw - segment;
  const t = Math.max(0, Math.min(1, (phase - 0.12) / 0.60));
  const transition = t * t * (3 - 2 * t);
  const moving = phase > 0.12 && phase < 0.72;
  return { segment, phase, transition, moving, chapter: phase >= 0.72 ? segment + 1 : segment };
}

/** Keep the checkpoint lit while stopped, with a short fade on arrival and departure. */
export function getJourneyFocusStrength(progress: number) {
  const { chapter, phase } = getJourneyFrame(progress);
  if (chapter === 0) return 0;
  const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  if (phase >= 0.72) return smooth((phase - 0.72) / 0.10);
  if (phase <= 0.12) return 1;
  return 1 - smooth((phase - 0.12) / 0.16);
}

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
const CHECKPOINT_DESCRIPTIONS: Record<number, string> = {};

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
