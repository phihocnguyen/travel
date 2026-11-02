"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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
    setActiveChapter, activeChapter, season, setSeason,
  } = useMapUI();

  useEffect(() => {
    if (explored || !root.current) return;
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
      journeyProgress.current = p;
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
  }, [explored, ready, journeyProgress, setActiveChapter]);

  const goTo = (index: number) => {
    const space = root.current?.closest<HTMLElement>("[data-journey-scroll-space]");
    if (!space) return;
    const start = space.getBoundingClientRect().top + window.scrollY;
    const length = space.offsetHeight - window.innerHeight;
    const y = start + length * (index / (JOURNEY_CHAPTERS.length - 1));
    window.scrollTo({ top: y, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  const startExploring = () => {
    explore(false);
    window.scrollTo({ top: 0, behavior: "instant" });
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
          <button
            key={chapter.index}
            type="button"
            className={`group flex items-center gap-2.5 text-[10px] font-semibold transition-colors ${
              activeChapter === i ? "text-mango" : "text-cream/60 hover:text-cream"
            }`}
            onClick={() => goTo(i)}
            aria-current={activeChapter === i ? "step" : undefined}
            aria-label={`Đến chương ${i + 1}: ${chapter.emphasis}`}
            title={chapter.emphasis}
          >
            <span
              className={`hidden max-w-0 overflow-hidden whitespace-nowrap text-right transition-all duration-300 lg:block ${
                activeChapter === i
                  ? "max-w-48 opacity-100"
                  : "opacity-0 group-hover:max-w-48 group-hover:opacity-100"
              }`}
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
          </button>
        ))}
      </nav>

      <div className="absolute inset-0" aria-live="off">
        {JOURNEY_CHAPTERS.map((chapter, i) => {
          const position = POSITION_CLASSES[chapter.position];

          return (
            <article
              key={chapter.index}
              data-journey-chapter
              className={`absolute inset-0 z-10 flex flex-col justify-center px-4 py-24 sm:px-8 lg:px-16 ${position}`}
              aria-label={`Chương ${i + 1}`}
            >
              <div
                className={`pointer-events-auto w-full ${
                  chapter.variant === "event" ? "max-w-3xl" : "max-w-2xl"
                }`}
              >
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

                  <p className={`mt-4 text-[13px] leading-relaxed text-cream/80 drop-shadow-[0_1px_10px_rgba(4,20,14,0.6)] sm:text-sm ${position === "center" ? "mx-auto max-w-xl" : "max-w-lg"}`}>
                    {chapter.description}
                  </p>

                    {chapter.bullets && (
                      <ul className={`mt-4 grid gap-2 ${position === "center" ? "mx-auto max-w-lg" : "max-w-lg"} text-left`}>
                        {chapter.bullets.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-cream/80">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mango" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    {chapter.meta && (
                      <dl className={`mt-4 flex flex-wrap gap-2.5 ${position === "center" ? "justify-center" : ""}`}>
                        {chapter.meta.map((item) => (
                          <div key={item.label} className="rounded-xl border border-cream/20 bg-forest/60 px-3.5 py-2 text-left backdrop-blur-md">
                            <dt className="text-[8px] font-bold uppercase tracking-[0.22em] text-cream/60">
                              {item.label}
                            </dt>
                            <dd className="mt-0.5 font-display text-sm font-semibold text-cream">
                              {item.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}

                    {chapter.ctaTitle && (
                      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-mango">
                        {chapter.ctaTitle}
                      </p>
                    )}
                    {chapter.ctaBody && (
                      <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-cream/80">
                        {chapter.ctaBody}
                      </p>
                    )}

                    <div className={`mt-5 flex flex-wrap items-center gap-2.5 ${position === "center" ? "justify-center" : ""}`}>
                      {chapter.cta && (
                        <Link
                          href={chapter.cta.href}
                          className="inline-flex items-center gap-2 rounded-full bg-mango px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-forest transition-colors hover:bg-mango-bright"
                        >
                          {chapter.cta.label}
                          <span aria-hidden>↗</span>
                        </Link>
                      )}
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

                    {chapter.note && (
                      <p className="mt-3 text-[10.5px] italic leading-relaxed text-cream/70">
                        {chapter.note}
                      </p>
                    )}

                    {i > 0 && i < JOURNEY_CHAPTERS.length - 1 && (
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
