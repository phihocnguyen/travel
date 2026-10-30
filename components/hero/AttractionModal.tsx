"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ATTRACTIONS, CATEGORY_COLORS, type Attraction } from "@/lib/map/attractions";
import { useMapUI } from "@/components/map/MapUIContext";

const EXIT_MS = 520;

export default function AttractionModal() {
  const { selectedAttractionId, setSelectedAttractionId } = useMapUI();
  const attraction =
    selectedAttractionId == null
      ? null
      : ATTRACTIONS[selectedAttractionId] ?? null;
  const [shown, setShown] = useState<Attraction | null>(attraction);
  const [open, setOpen] = useState(false);

  // Keep the last card mounted long enough to slide out, while a new
  // selection updates the content in place without closing the panel.
  useEffect(() => {
    let frame = 0;
    let timer = 0;
    if (attraction) {
      // Defer one frame so a freshly mounted card paints off-screen first and
      // the CSS transform can actually animate in.
      frame = requestAnimationFrame(() => {
        setShown(attraction);
        setOpen(true);
      });
    } else {
      frame = requestAnimationFrame(() => setOpen(false));
      timer = window.setTimeout(() => setShown(null), EXIT_MS);
    }
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [attraction]);

  useEffect(() => {
    if (!attraction) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedAttractionId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [attraction, setSelectedAttractionId]);

  return (
    <>
      <div
        className={`attraction-modal${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal={open}
        aria-label={shown?.name ?? "Điểm đến"}
        aria-hidden={!open}
      >
        {shown && (
          <article
            className="attraction-card"
            style={
              {
                "--attraction-color": CATEGORY_COLORS[shown.category],
              } as CSSProperties
            }
          >
            <button
              type="button"
              className="attraction-card__close"
              onClick={() => setSelectedAttractionId(null)}
              aria-label="Đóng thông tin điểm đến"
            >
              ×
            </button>

            <div className="attraction-card__visual">
              <span className="attraction-card__index">
                {String(shown.id + 1).padStart(2, "0")}
              </span>
              <span className="attraction-card__category">
                {shown.category}
              </span>
              <span className="attraction-card__area">
                {shown.area} · Đồng Tháp
              </span>
              <span className="attraction-card__mark" aria-hidden>
                <span />
              </span>
            </div>

            <div className="attraction-card__body">
              <h2 className="attraction-card__name">{shown.name}</h2>
              <p className="attraction-card__summary">{shown.summary}</p>
              <p className="attraction-card__description">
                {shown.description}
              </p>

              <ul className="attraction-card__highlights">
                {shown.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>

              <dl className="attraction-card__facts">
                <div>
                  <dt>Thời điểm đẹp</dt>
                  <dd>{shown.bestTime}</dd>
                </div>
                <div>
                  <dt>Toạ độ</dt>
                  <dd>
                    {shown.lat.toFixed(4)}°N · {shown.lon.toFixed(4)}°E
                  </dd>
                </div>
              </dl>

              <div className="attraction-card__actions">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${shown.lat},${shown.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hero-cta hero-cta--primary"
                >
                  Mở bản đồ
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
                </a>
                <button
                  type="button"
                  className="attraction-card__back"
                  onClick={() => setSelectedAttractionId(null)}
                >
                  Đóng panel
                </button>
              </div>
            </div>
          </article>
        )}
      </div>

      {open && (
        <button
          type="button"
          className="hero-scrim attraction-scrim"
          onClick={() => setSelectedAttractionId(null)}
          aria-label="Đóng thông tin điểm đến"
        />
      )}
    </>
  );
}
