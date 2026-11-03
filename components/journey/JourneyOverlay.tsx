"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { JOURNEY_CHAPTERS, JOURNEY_CHECKPOINTS } from "./journeyData";
import { useMapUI } from "../map/MapUIContext";

const POSITION_CLASSES = {
  center: "items-center text-center",
  left: "items-start text-left",
  right: "items-end text-right",
} as const;

/** One pinned-looking sticky map with native document scroll. One writer owns progress. */
export default function JourneyOverlay() {
  const root = useRef<HTMLDivElement>(null);
  const {
    explored, ready, explore, journeyProgress,
    setActiveChapter, activeChapter, season, setSeason, setJourneyProgress,
  } = useMapUI();

  useLayoutEffect(() => {
    // Wait until the map's intro/loading cover is ready to leave. This avoids
    // initializing the chapter timeline once during loading and again at reveal.
    if (explored || !ready || !root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const container = root.current.closest<HTMLElement>("[data-journey-scroll-space]");
    const stage = root.current.closest<HTMLElement>("[data-journey-stage]");
    if (!container || !stage) return;
    const chapters = gsap.utils.toArray<HTMLElement>("[data-journey-chapter]", root.current);
    const bar = root.current.querySelector<HTMLElement>("[data-journey-progress]");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const maxIndex = JOURNEY_CHAPTERS.length - 1;
    let lastIndex = -1;

    gsap.set(chapters, { autoAlpha: 0, y: reduced ? 0 : 30, filter: reduced ? "none" : "blur(10px)" });
    gsap.set(chapters[0], { autoAlpha: 1, y: 0, filter: "blur(0px)" });
    const timeline = gsap.timeline({ paused: true });
    // Stage one chapter per unit; chapter is stable during checkpoint approach/hold.
    for (let i = 0; i <= maxIndex; i++) {
      if (i > 0) timeline.to(chapters[i], {
        autoAlpha: 1, y: 0, filter: "blur(0px)", duration: reduced ? 0.02 : 0.27,
        ease: "power2.out",
      }, i - 0.08);
      if (i < maxIndex) timeline.to(chapters[i], {
        autoAlpha: 0, y: reduced ? 0 : -24,
        filter: reduced ? "none" : "blur(8px)", duration: reduced ? 0.02 : 0.25,
        ease: "power2.in",
      }, i + 0.68);
    }
    timeline.to({}, { duration: 0.01 }, maxIndex);

    const onProgress = (p: number) => {
      setJourneyProgress(p);
      timeline.progress(p);
      if (bar) bar.style.transform = `scaleX(${p})`;
      const raw = p * maxIndex;
      const nearest = Math.max(0, Math.min(maxIndex, Math.round(raw)));
      if (nearest !== lastIndex) {
        lastIndex = nearest;
        setActiveChapter(nearest);
      }
      // The focus only blooms near a checkpoint's hold segment; it fades while in transit.
      const distance = Math.abs(raw - Math.round(raw));
      const focus = nearest > 0 && nearest <= JOURNEY_CHECKPOINTS.length
        ? Math.max(0, Math.min(1, (0.58 - distance) / 0.17)) : 0;
      stage.style.setProperty("--focus-strength", reduced ? "0" : focus.toFixed(3));
    };

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top top", end: "bottom bottom",
      invalidateOnRefresh: true,
      onUpdate(self) { onProgress(self.progress); },
      // Deliberately no mandatory snap: reversible scroll remains responsive.
    });
    onProgress(trigger.progress);
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh);
    ScrollTrigger.refresh();
    return () => {
      window.removeEventListener("resize", refresh);
      trigger.kill();
      timeline.kill();
      stage.style.setProperty("--focus-strength", "0");
    };
  }, [explored, ready, journeyProgress, setActiveChapter, setJourneyProgress]);

  const startExploring = () => {
    explore(false);
  };

  if (explored) return null;

  return (
    <div
      ref={root}
      className="pointer-events-none absolute inset-0 z-[35] font-sans text-forest"
      aria-label="Hành trình khám phá Cao Lãnh, Đồng Tháp"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,36,23,0.42),transparent_20%,transparent_74%,rgba(8,36,23,0.5))]"
      />

      <header className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between gap-3 sm:left-6 sm:right-6 sm:top-6">
        <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-cream drop-shadow-[0_1px_8px_rgba(4,20,14,0.7)] sm:text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-mango" />
          Vị Xoài Dẫn Lối
          <span className="hidden text-cream/60 md:inline">— Trạm Hẹn Cao Lãnh</span>
        </span>
        <span className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-cream/80 drop-shadow-[0_1px_8px_rgba(4,20,14,0.7)] sm:block">
          Cao Lãnh · Đồng Tháp
        </span>
      </header>

      <nav
        className="pointer-events-auto absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-3 sm:right-5"
        aria-label="Chọn một trạm dừng"
      >
        {JOURNEY_CHAPTERS.map((chapter, i) => (
          <span
            key={chapter.index}
            className={`flex items-center gap-2.5 text-[10px] font-semibold ${
              activeChapter === i ? "text-mango" : "text-cream/60 hover:text-cream"
            }`}
            aria-current={activeChapter === i ? "step" : undefined}
            aria-label={`Đến chương ${i + 1}: ${chapter.emphasis}`}
          >
            <span
              className={`hidden whitespace-nowrap text-right lg:block ${activeChapter === i ? "opacity-100" : "opacity-0"}`}
            >
              {chapter.emphasis}
            </span>
            <span
              className={`h-2 w-2 rounded-full border transition-all ${
                activeChapter === i
                  ? "scale-125 border-mango bg-mango shadow-[0_0_14px_rgba(254,178,18,0.8)]"
                  : "border-cream/70 bg-transparent"
              }`}
            />
          </span>
        ))}
      </nav>

      <div className="absolute inset-0" aria-live="off">
        {JOURNEY_CHAPTERS.map((chapter, i) => {
          const position = POSITION_CLASSES[chapter.position];
          const isCentered = chapter.position === "center";

          return (
            <article
              key={chapter.index}
              data-journey-chapter
              className={`absolute inset-0 z-10 flex flex-col justify-center px-4 py-24 sm:px-8 lg:px-16 ${position}`}
              aria-label={`Chương ${i + 1}`}
            >
              <div
                className="journey-card pointer-events-auto w-full max-w-xl"
              >
                <div className="journey-card__index" aria-hidden="true">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span className="journey-card__index-line" />
                  <span>{String(JOURNEY_CHAPTERS.length).padStart(2, "0")}</span>
                </div>
                <div>
                  <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.24em] text-mango">
                    <span className="block h-px w-6 bg-mango" />
                    {chapter.eyebrow}
                  </span>

                  <h1 className="mt-3 font-display text-[clamp(1.9rem,4.2vw,3.7rem)] font-semibold leading-[1] tracking-[-0.03em] text-cream drop-shadow-[0_2px_18px_rgba(4,20,14,0.55)]">
                    {chapter.title}
                    <br />
                    <em className="font-normal not-italic text-mango">{chapter.emphasis}</em>
                  </h1>

                  <p className={`mt-4 text-[13px] leading-relaxed text-cream/80 drop-shadow-[0_1px_10px_rgba(4,20,14,0.6)] sm:text-sm ${isCentered ? "mx-auto max-w-xl" : "max-w-lg"}`}>
                    {chapter.description}
                  </p>

                    <div className={`mt-5 flex flex-wrap items-center gap-2.5 ${isCentered ? "justify-center" : ""}`}>
                      {i === JOURNEY_CHAPTERS.length - 1 && (
                        <button
                          type="button"
                          onClick={startExploring}
                          className="inline-flex items-center gap-2 rounded-full border border-cream/40 bg-forest/40 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-cream backdrop-blur-md transition-colors hover:bg-forest/60"
                        >
                          Khám phá bản đồ
                          <span aria-hidden>↗</span>
                        </button>
                      )}
                    </div>

                    {i > 0 && (
                      <span className="mt-4 inline-block rounded-full border border-cream/20 bg-forest/60 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-cream/70 backdrop-blur-md">
                        Trạm {String(i).padStart(2, "0")} / {String(JOURNEY_CHECKPOINTS.length).padStart(2, "0")}
                      </span>
                    )}
                  </div>
                </div>
            </article>
          );
        })}
      </div>

      <div
        className="pointer-events-auto absolute bottom-20 left-4 z-30 flex gap-1 rounded-full border border-cream/25 bg-forest/60 p-1 backdrop-blur-md sm:left-6"
        role="group"
        aria-label="Sắc thái mùa"
      >
        {([
          ["mango", "Mùa xoài"],
          ["dry", "Mùa khô"],
          ["flood", "Mùa nước nổi"],
        ] as const).map(([value, label]) => (
          <button
            type="button"
            key={value}
            onClick={() => setSeason(value)}
            className={`rounded-full px-3 py-1.5 text-[9px] font-semibold transition-colors ${
              season === value
                ? "bg-cream text-forest"
                : "text-cream/70 hover:text-cream"
            }`}
            aria-pressed={season === value}
          >
            {label}
          </button>
        ))}
      </div>

      <footer className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-4 text-[8px] font-semibold uppercase tracking-[0.2em] text-cream/70 sm:left-6 sm:right-6 sm:text-[9px]">
        <span className="flex shrink-0 items-center gap-2">
          <span className="animate-bounce text-sm" aria-hidden>↓</span>
          Cuộn để khám phá
        </span>
        <div className="relative h-px max-w-64 flex-1 bg-cream/25">
          <span data-journey-progress className="block h-full origin-left scale-x-0 bg-mango" />
        </div>
        <span className="text-cream/50">
          {String(activeChapter + 1).padStart(2, "0")} /{" "}
          {String(JOURNEY_CHAPTERS.length).padStart(2, "0")}
        </span>
      </footer>
    </div>
  );
}
