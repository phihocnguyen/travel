"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AmbientBed } from "@/lib/audio/ambient";
import { ATTRACTIONS } from "@/lib/map/attractions";
import { useMapUI } from "@/components/map/MapUIContext";

const MENU_ITEMS = [
  { label: "Overview", note: "The Mekong Delta" },
  { label: "Destinations", note: `${ATTRACTIONS.length} checkpoints` },
  { label: "Ecology", note: "Tram Chim · wetlands" },
  { label: "Culture", note: "Heritage · craft villages" },
];

function AudioIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
        opacity={muted ? 0.55 : 1}
      />
      {muted ? (
        <path
          d="M16 9l5 6M21 9l-5 6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        d="M5 12h13M12.5 6.5L19 12l-6.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HeroOverlay() {
  const {
    explored,
    ready,
    loadProgress,
    explore,
    audioEnabled,
    setAudioEnabled,
    inquireOpen,
    setInquireOpen,
    menuOpen,
    setMenuOpen,
    selectedAttractionId,
    setSelectedAttractionId,
  } = useMapUI();

  const [sent, setSent] = useState(false);
  const bed = useRef<AmbientBed | null>(null);

  useEffect(() => {
    if (audioEnabled) {
      bed.current ??= new AmbientBed();
      bed.current.start();
    } else {
      bed.current?.stop();
      bed.current = null;
    }
  }, [audioEnabled]);

  useEffect(
    () => () => {
      bed.current?.stop();
      bed.current = null;
    },
    [],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setInquireOpen(false);
      setMenuOpen(false);
      setSelectedAttractionId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setInquireOpen, setMenuOpen, setSelectedAttractionId]);

  const progress = Math.round(loadProgress * 100);

  const submitInquire = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <div className={`hero-ui${explored ? " is-explored" : ""}`}>
      <div className="hero-mist" aria-hidden />

      <header className="hero-header">
        <button
          type="button"
          className="hero-nav-button"
          onClick={() => setMenuOpen(true)}
        >
          <span className="hero-menu-lines" aria-hidden>
            <span />
            <span />
          </span>
          Menu
        </button>

        <div className="hero-brand">
          <span className="hero-brand__name">Dong Thap</span>
          <span className="hero-brand__tag">The waterways · 2025</span>
        </div>

        <div className="hero-header__right">
          <Link href="/login" className="hero-auth-link">
            Sign in
          </Link>
          <span className="hero-checkpoint-count">
            {ATTRACTIONS.length} checkpoints
          </span>
          <button
            type="button"
            className="hero-cta hero-cta--small"
            onClick={() => {
              setSent(false);
              setInquireOpen(true);
            }}
          >
            Contact
          </button>
        </div>
      </header>

      <section className="hero-center" aria-hidden={explored}>
        <div className="hero-intro">
          <p className="hero-kicker">
            <span className="hero-kicker__line" aria-hidden />
            <span>Mekong Delta</span>
            <span className="hero-kicker__dot" aria-hidden />
            <span>Vietnam</span>
            <span className="hero-kicker__line" aria-hidden />
          </p>

          <h1 className="hero-title">
            <span className="hero-title__main">Dong Thap</span>
            <span className="hero-title__accent">the waterways</span>
          </h1>

          <div className="hero-rule" aria-hidden>
            <span />
          </div>

          <p className="hero-subtitle">
            Where the Tien River opens into a sea of water, lotus fields,
            melaleuca groves and winding canals shape a gentle land.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="hero-cta hero-cta--primary"
              onClick={() => explore(false)}
              disabled={!ready}
            >
              <span>{ready ? "Explore the map" : "Loading the map"}</span>
              <ArrowIcon />
            </button>
            <button
              type="button"
              className="hero-audio-link"
              onClick={() => explore(true)}
              disabled={!ready}
            >
              <AudioIcon muted={false} />
              Begin with sound
            </button>
          </div>
        </div>
      </section>

      {explored && selectedAttractionId == null && (
        <div className="hero-hint">
          <span className="hero-hint__dot" aria-hidden />
          Hover to see communes · Tap a checkpoint to explore
        </div>
      )}

      <footer className="hero-footer">
        <button
          type="button"
          className="hero-footer__audio"
          onClick={() => {
            if (!explored) explore(false);
            else setAudioEnabled(!audioEnabled);
          }}
        >
          <AudioIcon muted={!audioEnabled} />
          <span>
            {!explored
              ? "Start without sound"
              : audioEnabled
                ? "Mute sound"
                : "Enable sound"}
          </span>
        </button>

        <p className="hero-footer__hint">
          Drag to rotate · Scroll to zoom · Tap to select
        </p>

        <p className="hero-attribution">
          Satellite imagery © Esri, Maxar, Earthstar Geographics · Terrain ©
          Mapzen/AWS · Data © OpenStreetMap
        </p>
      </footer>

      <div
        className={`hero-loader${ready ? " is-done" : ""}`}
        aria-live="polite"
      >
        <div className="hero-loader__inner">
          <p className="hero-loader__brand">Dong Thap</p>
          <p className="hero-loader__label">
            {ready ? "Ready" : "Building the waterways map"}
          </p>
          <div className="hero-loader__track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="hero-loader__percent">{progress}%</p>
        </div>
      </div>

      <div
        className={`hero-drawer${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="hero-drawer__head">
          <span className="hero-brand__name hero-brand__name--dark">
            Dong Thap
          </span>
          <button
            type="button"
            className="hero-drawer__close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <nav className="hero-drawer__nav">
          {MENU_ITEMS.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                if (index === 0 && !explored) explore(false);
              }}
            >
              <span className="hero-drawer__index">0{index + 1}</span>
              <span className="hero-drawer__label">{item.label}</span>
              <span className="hero-drawer__note">{item.note}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setSent(false);
              setInquireOpen(true);
            }}
          >
            <span className="hero-drawer__index">05</span>
            <span className="hero-drawer__label">Contact</span>
            <span className="hero-drawer__note">Partnership · Press</span>
          </button>
        </nav>
        <p className="hero-drawer__foot">
          The interactive atlas of Dong Thap · Travel checkpoints
        </p>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="hero-scrim"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      <div
        className={`inquire-modal${inquireOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Contact"
        aria-hidden={!inquireOpen}
      >
        <div className="inquire-card">
          <button
            type="button"
            className="inquire-card__close"
            onClick={() => setInquireOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
          <p className="inquire-card__eyebrow">Inquire</p>
          <h2 className="inquire-card__title">Connect with Dong Thap</h2>
          {sent ? (
            <p className="inquire-card__done">
              Thank you. We have received your message and will reply as soon
              as possible.
            </p>
          ) : (
            <form onSubmit={submitInquire} className="inquire-form">
              <label>
                <span>Full name</span>
                <input name="name" required autoComplete="name" />
              </label>
              <label>
                <span>Email</span>
                <input name="email" type="email" required autoComplete="email" />
              </label>
              <label>
                <span>Message</span>
                <textarea name="message" rows={3} required />
              </label>
              <button type="submit" className="hero-cta hero-cta--primary">
                Send message
                <ArrowIcon />
              </button>
            </form>
          )}
        </div>
      </div>

      {inquireOpen && (
        <button
          type="button"
          className="hero-scrim"
          onClick={() => setInquireOpen(false)}
          aria-label="Close contact"
        />
      )}
    </div>
  );
}
