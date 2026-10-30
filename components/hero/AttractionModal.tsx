"use client";

import { useEffect, type CSSProperties } from "react";
import { ATTRACTIONS, CATEGORY_COLORS } from "@/lib/map/attractions";
import { useMapUI } from "@/components/map/MapUIContext";

export default function AttractionModal() {
  const { selectedAttractionId, setSelectedAttractionId } = useMapUI();
  const attraction =
    selectedAttractionId == null
      ? null
      : ATTRACTIONS[selectedAttractionId] ?? null;

  useEffect(() => {
    if (!attraction) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedAttractionId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [attraction, setSelectedAttractionId]);

  const open = !!attraction;

  return (
    <>
      <div
        className={`attraction-modal${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={attraction?.name ?? "Điểm đến"}
        aria-hidden={!open}
      >
        {attraction && (
          <article
            className="attraction-card"
            style={
              {
                "--attraction-color": CATEGORY_COLORS[attraction.category],
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
                {String(attraction.id + 1).padStart(2, "0")}
              </span>
              <span className="attraction-card__category">
                {attraction.category}
              </span>
              <span className="attraction-card__area">
                {attraction.area} · Đồng Tháp
              </span>
              <span className="attraction-card__mark" aria-hidden>
                <span />
              </span>
            </div>

            <div className="attraction-card__body">
              <h2 className="attraction-card__name">{attraction.name}</h2>
              <p className="attraction-card__summary">{attraction.summary}</p>
              <p className="attraction-card__description">
                {attraction.description}
              </p>

              <ul className="attraction-card__highlights">
                {attraction.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>

              <dl className="attraction-card__facts">
                <div>
                  <dt>Thời điểm đẹp</dt>
                  <dd>{attraction.bestTime}</dd>
                </div>
                <div>
                  <dt>Toạ độ</dt>
                  <dd>
                    {attraction.lat.toFixed(4)}°N ·{" "}
                    {attraction.lon.toFixed(4)}°E
                  </dd>
                </div>
              </dl>

              <div className="attraction-card__actions">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${attraction.lat},${attraction.lon}`}
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
                  Về toàn cảnh
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
