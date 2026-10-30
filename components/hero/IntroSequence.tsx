"use client";

import { useEffect, useState } from "react";
import { useMapUI } from "@/components/map/MapUIContext";

const EXIT_MS = 1100;

export default function IntroSequence() {
  const { introOpen, ready, loadProgress, dismissIntro } = useMapUI();
  const [leaving, setLeaving] = useState(false);
  const progress = Math.round(loadProgress * 100);

  // Hold the page at the first chapter until the atlas is actually usable.
  useEffect(() => {
    if (!introOpen) return;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
    };
  }, [introOpen]);

  // Enter automatically as soon as the atlas is ready — no "begin" button.
  useEffect(() => {
    if (!introOpen || !ready) return;
    setLeaving(true);
  }, [introOpen, ready]);

  useEffect(() => {
    if (!leaving) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => dismissIntro(), reduced ? 0 : EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, dismissIntro]);

  if (!introOpen) return null;

  return (
    <section
      className={`intro-sequence${leaving ? " is-leaving" : ""}`}
      aria-label="Dong Thap interactive atlas introduction"
      aria-hidden={leaving}
    >
      <div className="intro-sequence__mist" aria-hidden />
      <div className="intro-sequence__grain" aria-hidden />

      <header className="intro-sequence__head">
        <span className="intro-sequence__brand">Dong Thap</span>
        <span className="intro-sequence__tag">An interactive atlas · 2025</span>
      </header>

      <div className="intro-sequence__center">
        <p className="intro-sequence__kicker">
          <span className="intro-sequence__rule" aria-hidden />
          Mekong Delta · Vietnam
          <span className="intro-sequence__rule" aria-hidden />
        </p>

        <h1 className="intro-sequence__title">
          The <em>waterways</em>
        </h1>

        <p className="intro-sequence__subtitle">
          Lotus fields, melaleuca groves and canal country, seen from above.
          Scroll to travel from one checkpoint to the next.
        </p>

        <div className="intro-sequence__loader">
          <div className="intro-sequence__track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="intro-sequence__meta">
            <span>{ready ? "The map is ready" : "Preparing the atlas"}</span>
            <span>{progress}%</span>
          </div>
        </div>

        <p className={`intro-sequence__auto${ready ? " is-ready" : ""}`}>
          <span className="intro-sequence__dot" aria-hidden />
          {ready ? "Entering the atlas" : "Loading satellite imagery"}
        </p>
      </div>

      <footer className="intro-sequence__foot">
        <span>04 checkpoints · 15 destinations</span>
        <span>Satellite © Esri · Terrain © Mapzen/AWS · Data © OpenStreetMap</span>
      </footer>
    </section>
  );
}
