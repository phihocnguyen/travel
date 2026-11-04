"use client";

import { useState } from "react";
import { CATEGORY_LABELS, type Attraction } from "@/lib/map/attractions";

export default function JourneyStopCard({ attraction, station, total, onDetails, onExplore }: {
  attraction: Attraction; station: number; total: number; onDetails: () => void; onExplore?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const image = failed ? "/cao-lanh-orchard.jpg" : attraction.image;
  return <div className="checkpoint-fonts pointer-events-auto relative isolate h-[380px] w-[min(340px,calc(100vw-64px))] overflow-hidden rounded-[26px] text-left text-white shadow-2xl sm:h-[440px]">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={image} alt={failed ? "Ảnh minh họa miệt vườn Cao Lãnh" : attraction.imageCaption} onError={() => setFailed(true)} className="absolute inset-0 -z-20 h-full w-full object-cover" />
    <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
    <div aria-hidden className="absolute inset-x-0 bottom-0 h-[58%] overflow-hidden [mask-image:linear-gradient(transparent,black_25%)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="absolute bottom-0 h-[380px] w-full scale-110 object-cover blur-xl sm:h-[440px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/20" />
    </div>
    <span className="absolute left-5 top-5 rounded-full border border-white/30 bg-black/15 px-3 py-1.5 text-[10px] tracking-[0.15em] backdrop-blur-md">TRẠM {String(station).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
      <p className="mb-2 text-[9px] tracking-[0.12em] text-white/70">{CATEGORY_LABELS[attraction.category]}</p>
      <h2 className="text-[24px] font-medium leading-tight tracking-[-0.04em]">{attraction.name}</h2>
      <p className="mt-3 text-xs leading-relaxed text-white/85">{attraction.summary}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[10px] text-white/60">{attraction.area}</span>
        <button type="button" onClick={onDetails} className="shrink-0 rounded-full border border-white/30 bg-white/10 px-3 py-2 text-[9px] uppercase tracking-widest backdrop-blur-md hover:bg-white/20">Khám phá ↗</button>
      </div>
      {onExplore && <button type="button" onClick={onExplore} className="mt-4 border-t border-white/20 pt-3 text-[10px] text-white/80">Khám phá bản đồ tự do ↗</button>}
    </div>
  </div>;
}
