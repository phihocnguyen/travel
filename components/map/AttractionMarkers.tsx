"use client";

import { useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { ATTRACTIONS, CATEGORY_LABELS } from "@/lib/map/attractions";
import type { MapAssets } from "@/lib/map/assets";
import { useMapUI } from "./MapUIContext";
import { JOURNEY_CHECKPOINTS } from "@/components/journey/journeyData";

export function AttractionMarkers({ assets, y }: { assets: MapAssets; y: number }) {
  const { selectedAttractionId, setSelectedAttractionId, setHoveredId, explored, activeChapter } = useMapUI();
  const journeyId = !explored && activeChapter > 0 ? JOURNEY_CHECKPOINTS[activeChapter - 1]?.index : null;
  const pinnedId = selectedAttractionId ?? journeyId;
  const [hovered, setHovered] = useState<number | null>(null);
  const markers = useRef<(HTMLDivElement | null)[]>([]);
  const { size } = useThree();
  const anchors = useMemo(() => ATTRACTIONS.map((attraction) => {
    const [x, z] = assets.projector.toLocal(attraction.lon, attraction.lat);
    return { attraction, world: new Vector3(x, y + 0.4, z) };
  }), [assets, y]);

  useFrame(({ camera, size }) => {
    anchors.forEach((anchor, index) => {
      const projected = anchor.world.clone().project(camera);
      const visible = Math.abs(projected.x) < 1.05 && Math.abs(projected.y) < 1.05 && Math.abs(projected.z) < 1;
      const marker = markers.current[index];
      if (marker) {
        marker.style.display = visible ? "block" : "none";
        marker.style.transform = `translate(${(projected.x + 1) * size.width / 2}px, ${(1 - projected.y) * size.height / 2}px) translate(-50%, -50%)`;
      }
    });
  });

  return <Html calculatePosition={() => [0, 0]} zIndexRange={[50, 0]} style={{ pointerEvents: "none" }}>
    <div className="checkpoint-fonts absolute left-0 top-0" style={{ width: size.width, height: size.height, pointerEvents: "none" }}>
      {anchors.map(({ attraction }) => {
        const active = pinnedId === attraction.id || hovered === attraction.id;
        return <div key={attraction.id} ref={(element) => { markers.current[attraction.id] = element; }} className="absolute left-0 top-0" style={{ zIndex: active ? 2 : 1 }}>
          <button type="button" aria-label={attraction.name} aria-pressed={selectedAttractionId === attraction.id}
            onMouseEnter={() => { setHovered(attraction.id); setHoveredId(null); }} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(attraction.id)} onBlur={() => setHovered(null)}
            onClick={(event) => { event.stopPropagation(); setHoveredId(null); setSelectedAttractionId(selectedAttractionId === attraction.id ? null : attraction.id); }}
            className="relative grid h-10 w-10 place-items-center rounded-full border-2 border-[#eeeade] text-xs font-semibold shadow-lg transition-[background-color,color,scale] duration-200 motion-reduce:transition-none hover:scale-110 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            style={{ pointerEvents: "auto", background: active ? "#eeeade" : "#36594b", color: active ? "#36594b" : "#eeeade" }}>
            <span className="tabular-nums">{String(attraction.id + 1).padStart(2, "0")}</span>
            {active && <span className="absolute bottom-full left-1/2 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-[#f5f2e9] px-3 py-2 text-left text-[#294638] shadow-lg">
              <span className="block text-[9px] opacity-60">{CATEGORY_LABELS[attraction.category]}</span>
              <span className="block text-xs leading-snug">{attraction.name}</span>
              <span className="mt-1 block text-[9px] opacity-60">{attraction.area}</span>
            </span>}
          </button>
        </div>;
      })}
    </div>
  </Html>;
}
