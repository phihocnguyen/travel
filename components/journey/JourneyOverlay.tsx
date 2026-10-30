"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { JOURNEY_CHAPTERS, JOURNEY_CHECKPOINTS } from "./journeyData";
import { useMapUI } from "../map/MapUIContext";

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
    <div ref={root} className="journey-overlay journey-overlay--wow" aria-label="An interactive journey through Dong Thap">
      <header className="journey-header">
        <span className="journey-brand">DONG THAP <span>— THE WATERWAYS</span></span>
        <span className="journey-tag">AN INTERACTIVE ATLAS</span>
      </header>
      <nav className="journey-navigation" aria-label="Choose a checkpoint">
        {JOURNEY_CHAPTERS.map((chapter, i) => (
          <button key={chapter.index} type="button" className={`journey-nav-point${activeChapter === i ? " is-active" : ""}`}
            onClick={() => goTo(i)} aria-current={activeChapter === i ? "step" : undefined}
            aria-label={`Go to chapter ${i + 1}: ${chapter.emphasis}`} title={chapter.emphasis}>
            <span className="journey-nav-dot" /><span className="journey-nav-name">{chapter.emphasis}</span>
          </button>
        ))}
      </nav>
      <div className="journey-chapters" aria-live="off">
        {JOURNEY_CHAPTERS.map((chapter, i) => (
          <article key={chapter.index} data-journey-chapter
            className={`journey-chapter journey-chapter--${chapter.position}`} aria-label={`Chapter ${i + 1}`}>
            <div className="journey-chapter__glass">
              <span className="journey-eyebrow"><span className="journey-mini-line" />{chapter.eyebrow}</span>
              <h1 className="journey-heading"><span>{chapter.title}</span><br /><em>{chapter.emphasis}</em></h1>
              <p className="journey-description">{chapter.description}</p>
              {i > 0 && i < JOURNEY_CHAPTERS.length - 1 && (
                <span className="journey-chapter__number">STOP {String(i).padStart(2,"0")} / {String(JOURNEY_CHECKPOINTS.length).padStart(2,"0")}</span>
              )}
              {i === JOURNEY_CHAPTERS.length - 1 && (
                <button type="button" className="journey-cta" onClick={startExploring}>
                  START EXPLORING <span aria-hidden="true">↗</span>
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="journey-season-switcher" role="group" aria-label="Seasonal colour">
        {([
          ["mango", "Mango season"], ["dry", "Dry season"], ["flood", "Flood season"],
        ] as const).map(([value, label]) => (
          <button type="button" key={value} onClick={() => setSeason(value)}
            className={season === value ? "is-active" : ""} aria-pressed={season === value}>{label}</button>
        ))}
      </div>
      <footer className="journey-footer">
        <div className="journey-scroll-cue"><span className="journey-mouse">↓</span> SCROLL TO EXPLORE</div>
        <div className="journey-track"><span data-journey-progress /></div>
        <span className="journey-bottom-label">{String(activeChapter+1).padStart(2,"0")} / {String(JOURNEY_CHAPTERS.length).padStart(2,"0")}</span>
      </footer>
    </div>
  );
}
