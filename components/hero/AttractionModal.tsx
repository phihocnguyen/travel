"use client";

import { useEffect, useRef } from "react";
import DestinationPhotos from '@/components/photos/DestinationPhotos';
import { ATTRACTIONS, CATEGORY_LABELS } from "@/lib/map/attractions";
import { useMapUI } from "@/components/map/MapUIContext";
import { lockPageScroll } from "@/lib/ui/scroll-lock";

export default function AttractionModal() {
  const { selectedAttractionId, setSelectedAttractionId } = useMapUI();
  const attraction = selectedAttractionId == null ? null : ATTRACTIONS[selectedAttractionId];
  const closeButton = useRef<HTMLButtonElement>(null);
  const scrollBody = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!attraction) return;
    const previous = document.activeElement;
    const unlockScroll = lockPageScroll();
    closeButton.current?.focus();
    scrollBody.current?.scrollTo(0, 0);
    const onKey = (event: KeyboardEvent) => {
      if (document.querySelector('dialog[open][data-photo-lightbox]')) return;
      if (event.key === "Escape") setSelectedAttractionId(null);
      if (event.key === "Tab") {
        const elements = closeButton.current?.closest("article")?.querySelectorAll<HTMLElement>("button, a[href], [tabindex='0']");
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlockScroll();
      window.removeEventListener("keydown", onKey);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [attraction, setSelectedAttractionId]);
  if (!attraction) return null;
  return <div className="checkpoint-fonts fixed inset-0 z-[120] flex items-end justify-end p-3 sm:items-center sm:p-6">
    <button type="button" className="absolute inset-0 cursor-default bg-black/30 backdrop-blur-[3px]" onClick={() => setSelectedAttractionId(null)} aria-label="Đóng thông tin điểm đến" />
    <article role="dialog" aria-modal="true" aria-labelledby="checkpoint-title" className="relative flex max-h-[90dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-[#f8f7f3] text-[#292c28] shadow-2xl">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-black/10 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[9px] uppercase tracking-[0.15em] text-black/45">Điểm {String(attraction.id + 1).padStart(2, "0")} · {CATEGORY_LABELS[attraction.category]}</p>
          <h2 id="checkpoint-title" className="mt-2 text-xl font-semibold leading-snug tracking-tight">{attraction.name}</h2>
          <p className="mt-1 text-xs text-black/50">{attraction.area}</p>
        </div>
        <button ref={closeButton} type="button" onClick={() => setSelectedAttractionId(null)} aria-label="Đóng thông tin điểm đến" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-black/15 text-xl hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2">×</button>
      </header>
      <div ref={scrollBody} tabIndex={0} aria-label="Nội dung chi tiết điểm đến" className="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-5 text-[13px] leading-relaxed sm:p-6">
        <DestinationPhotos key={attraction.id} photos={attraction.photos} caption={attraction.id === 9 || attraction.id === 10 ? attraction.imageCaption : undefined} />
        <p className="font-medium">{attraction.summary}</p>
        <dl className="space-y-3 border-y border-black/10 py-4">
          <div><dt className="text-[10px] font-semibold uppercase tracking-widest text-black/40">Loại hình</dt><dd className="mt-1">{attraction.type}</dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-widest text-black/40">Địa chỉ</dt><dd className="mt-1">{attraction.address}</dd></div>
        </dl>
        <section><h3 className="mb-2 font-semibold">Câu chuyện & đặc trưng</h3><p className="text-black/70">{attraction.description}</p></section>
        <ul className="flex flex-wrap gap-2" aria-label="Điểm nổi bật">{attraction.highlights.map((highlight) => <li key={highlight} className="rounded-md border border-black/10 px-2.5 py-1 text-[11px] text-black/60">{highlight}</li>)}</ul>
        <section><h3 className="mb-2 font-semibold">Trải nghiệm</h3><p className="text-black/70">{attraction.experience}</p></section>
        {attraction.inside && <section className="border-y border-black/10 py-4"><p className="mb-1 text-[9px] uppercase tracking-widest text-black/40">Trong cùng quần thể</p><h3 className="font-semibold">{attraction.inside.name}</h3><p className="mt-2 text-black/70">{attraction.inside.description}</p></section>}
        <section><h3 className="mb-2 font-semibold">Thông tin tham quan</h3><p className="text-black/70">{attraction.bestTime}</p></section>
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-black/10 px-5 py-3 sm:px-6">
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attraction.name + " " + attraction.address)}`} target="_blank" rel="noreferrer" className="inline-flex rounded-full border border-black/20 px-4 py-2 text-xs hover:bg-black/5">Mở trên Google Maps ↗</a>
        <button type="button" onClick={() => setSelectedAttractionId(null)} className="px-3 py-2 text-xs text-black/60">Quay lại bản đồ</button>
      </footer>
    </article>
  </div>;
}
