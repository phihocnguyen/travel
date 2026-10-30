"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { JOURNEY_CHAPTERS } from "./journeyData";
import { useMapUI } from "../map/MapUIContext";

/**
 * A tall scroll-space owns the real scroll distance. The WebGL stage remains
 * sticky. ScrollTrigger only reads progress, so no pin spacer is required.
 * Every chapter shares the *same* WebGL map canvas.
 */
export default function JourneyOverlay() {
  const root = useRef<HTMLDivElement>(null);
  const { explored, ready, explore, journeyProgress } = useMapUI();

  useEffect(() => {
    if (!ready || explored || !root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const rootEl = root.current;
    const scrollSpace = rootEl.closest<HTMLElement>("[data-journey-scroll-space]");
    if (!scrollSpace) return;
    const chapters = gsap.utils.toArray<HTMLElement>("[data-journey-chapter]", rootEl);
    const progressBar = rootEl.querySelector<HTMLElement>("[data-journey-progress]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.set(chapters, { autoAlpha: 0, yPercent: 12, filter: "blur(14px)" });
    gsap.set(chapters[0], { autoAlpha: 1, yPercent: 0, filter: "blur(0px)" });

    const total = JOURNEY_CHAPTERS.length;
    const duration = total - 1;
    const timeline = gsap.timeline({ paused: true, defaults: { ease: "none" } });
    for (let i = 0; i < total; i++) {
      if (i > 0) {
        timeline.to(chapters[i], {
          autoAlpha: 1, yPercent: 0, filter: "blur(0px)",
          duration: reducedMotion ? 0.04 : 0.22,
        }, i - 0.12);
      }
      if (i < total - 1) {
        timeline.to(chapters[i], {
          autoAlpha: 0, yPercent: -9, filter: "blur(10px)",
          duration: reducedMotion ? 0.04 : 0.2,
        }, i + 0.62);
      }
    }
    timeline.to({}, { duration: 0.001 }, duration);

    const trigger = ScrollTrigger.create({
      trigger: scrollSpace,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onUpdate(self) {
        const p = self.progress;
        journeyProgress.current = p;
        timeline.progress(p);
        if (progressBar) progressBar.style.transform = `scaleX(${p})`;
      },
    });

    // Refresh positions on viewport changes. Native scroll remains enabled.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh);
    ScrollTrigger.refresh();
    return () => {
      window.removeEventListener("resize", refresh);
      trigger.kill();
      timeline.kill();
    };
  }, [ready, explored, journeyProgress]);

  const startExploring = () => {
    explore(false);
    // The long scroll-space collapses to one viewport on explore mode.
    // Reset native scroll position in the same user action.
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  if (explored) return null;

  return (
    <div ref={root} className="journey-overlay" aria-label="Hành trình giới thiệu tương tác">
      <header className="journey-header">
        <span className="journey-brand">MIỀN SÔNG NƯỚC <span>— 3D ATLAS</span></span>
        <span className="journey-tag">AN INTERACTIVE JOURNEY</span>
      </header>

      <div className="journey-chapters" aria-live="off">
        {JOURNEY_CHAPTERS.map((chapter, i) => (
          <article key={chapter.index} data-journey-chapter className={`journey-chapter journey-chapter--${chapter.position}`} aria-label={`Chương ${i + 1}`}>
            <span className="journey-eyebrow"><span className="journey-mini-line" />{chapter.eyebrow}</span>
            <h1 className="journey-heading">{chapter.title}<br /><em>{chapter.emphasis}</em></h1>
            <p className="journey-description">{chapter.description}</p>
            {i === JOURNEY_CHAPTERS.length - 1 && (
              <button type="button" className="journey-cta" onClick={startExploring}>
                BẮT ĐẦU KHÁM PHÁ <span aria-hidden="true">↗</span>
              </button>
            )}
          </article>
        ))}
      </div>

      <footer className="journey-footer">
        <div className="journey-scroll-cue"><span className="journey-mouse">↓</span> CUỘN ĐỂ TIẾP TỤC</div>
        <div className="journey-track"><span data-journey-progress /></div>
        <span className="journey-bottom-label">SCROLL / EXPLORE / DISCOVER</span>
      </footer>
    </div>
  );
}
