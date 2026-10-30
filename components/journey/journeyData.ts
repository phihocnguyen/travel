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
    eyebrow: "DONG THAP / AN INTERACTIVE JOURNEY",
    title: "Travel through",
    emphasis: "the waterways.",
    description:
      "Scroll to fly the camera from one destination to the next. Every stop reveals a different story of the delta.",
    position: "center",
  },
  ...JOURNEY_CHECKPOINTS.map(({ attraction }, i): JourneyChapter => ({
    index: String(i + 1).padStart(2, "0"),
    eyebrow: `CHECKPOINT ${String(i + 1).padStart(2, "0")} / ${attraction.category}`,
    title: "Discover",
    emphasis: attraction.name,
    description: attraction.summary,
    position: i % 2 === 0 ? "left" : "right",
  })),
  {
    index: String(CHECKPOINT_COUNT + 1).padStart(2, "0"),
    eyebrow: "CONTINUE THE JOURNEY",
    title: "Find your own",
    emphasis: "way.",
    description:
      "Rotate, zoom and choose any marker on the map to learn more about each place.",
    position: "center",
  },
];
