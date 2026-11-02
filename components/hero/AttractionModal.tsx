"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ATTRACTIONS, CATEGORY_COLORS, type Attraction } from "@/lib/map/attractions";
import { useMapUI } from "@/components/map/MapUIContext";

const EXIT_MS = 480;

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
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-[70] cursor-default bg-forest/40 backdrop-blur-[2px]"
          onClick={() => setSelectedAttractionId(null)}
          aria-label="Đóng thông tin điểm đến"
        />
      )}

      <div
        className="pointer-events-none fixed inset-0 z-[80] flex items-end justify-end p-3 sm:p-6"
        role="dialog"
        aria-modal={open}
        aria-label={shown?.name ?? "Điểm đến"}
        aria-hidden={!open}
      >
        {shown && (
          <article
            className={`pointer-events-auto flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-cream shadow-brand transition-all duration-500 ease-out ${
              open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={
              {
                "--attraction-color": CATEGORY_COLORS[shown.category],
              } as CSSProperties
            }
          >
            <div
              className="relative overflow-hidden px-6 pb-6 pt-5 text-cream"
              style={{
                background: `linear-gradient(135deg, var(--attraction-color) 0%, #15602c 85%)`,
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-cream/10"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-mango/20 blur-xl"
              />

              <button
                type="button"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-cream/20 text-xl leading-none text-cream backdrop-blur transition-colors hover:bg-cream/25"
                onClick={() => setSelectedAttractionId(null)}
                aria-label="Đóng thông tin điểm đến"
              >
                ×
              </button>

              <p className="font-display text-4xl font-semibold leading-none text-cream/90">
                {String(shown.id + 1).padStart(2, "0")}
              </p>
              <p className="mt-4 inline-flex rounded-full bg-cream/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] backdrop-blur">
                {shown.category}
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/70">
                {shown.area} · Đồng Tháp
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
              <div>
                <h2 className="font-display text-2xl font-semibold leading-tight text-forest">
                  {shown.name}
                </h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-forest/80">
                  {shown.summary}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-forest/60">
                  {shown.description}
                </p>
              </div>

              <ul className="flex flex-wrap gap-1.5">
                {shown.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="rounded-full bg-mint/40 px-3 py-1 text-[10px] font-semibold text-forest"
                  >
                    {highlight}
                  </li>
                ))}
              </ul>

              <dl className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-mint/25 px-4 py-3">
                  <dt className="text-[8px] font-bold uppercase tracking-[0.2em] text-forest/50">
                    Thời điểm đẹp
                  </dt>
                  <dd className="mt-1 text-[12px] font-medium leading-snug text-forest/80">
                    {shown.bestTime}
                  </dd>
                </div>
                <div className="rounded-2xl bg-mint/25 px-4 py-3">
                  <dt className="text-[8px] font-bold uppercase tracking-[0.2em] text-forest/50">
                    Toạ độ
                  </dt>
                  <dd className="mt-1 text-[12px] font-medium leading-snug text-forest/80">
                    {shown.lat.toFixed(4)}°N · {shown.lon.toFixed(4)}°E
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${shown.lat},${shown.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-cream transition-colors hover:bg-forest-mid"
                >
                  Mở trên Maps
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
                  className="rounded-full px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-forest/60 transition-colors hover:bg-forest/5 hover:text-forest"
                  onClick={() => setSelectedAttractionId(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </article>
        )}
      </div>
    </>
  );
}
