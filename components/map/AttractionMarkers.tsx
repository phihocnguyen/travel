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
  const lines = useRef<(SVGLineElement | null)[]>([]);
  const { size } = useThree();
  const anchors = useMemo(() => ATTRACTIONS.map((attraction) => {
    const [x, z] = assets.projector.toLocal(attraction.lon, attraction.lat);
    return { attraction, world: new Vector3(x, y + 0.4, z), projected: new Vector3(), x: 0, y: 0, anchorX: 0, anchorY: 0, visible: true };
  }), [assets, y]);

  useFrame(({ camera, size }) => {
    const points = anchors.map((anchor) => ({ ...anchor, projected: anchor.world.clone() }));
    for (const point of points) {
      point.projected.copy(point.world).project(camera);
      point.anchorX = (point.projected.x + 1) * size.width / 2;
      point.anchorY = (1 - point.projected.y) * size.height / 2;
      point.visible = Math.abs(point.projected.x) < 1.05 && Math.abs(point.projected.y) < 1.05 && Math.abs(point.projected.z) < 1;
      point.x = point.anchorX;
      point.y = point.anchorY;
    }
    const padding = 30;
    // CSS-pixel spacing is independent of camera distance, tilt and zoom.
    // Only the badge moves; its leader always ends at the geographic anchor.
    for (let iteration = 0; iteration < 100; iteration++) {
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        if (!a.visible) continue;
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          if (!b.visible) continue;
          const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
          if (distance >= 58) continue;
          const angle = distance > 0.01 ? Math.atan2(dy, dx) : (i + j) * 2.4;
          const push = (58 - distance) / 2 + 0.1;
          if (a.attraction.id === pinnedId) { b.x += Math.cos(angle) * push * 2; b.y += Math.sin(angle) * push * 2; }
          else if (b.attraction.id === pinnedId) { a.x -= Math.cos(angle) * push * 2; a.y -= Math.sin(angle) * push * 2; }
          else { a.x -= Math.cos(angle) * push; a.y -= Math.sin(angle) * push; b.x += Math.cos(angle) * push; b.y += Math.sin(angle) * push; }
        }
      }
      for (const point of points) {
        if (point.attraction.id === pinnedId) continue;
        point.x = Math.max(padding, Math.min(size.width - padding, point.x));
        point.y = Math.max(padding, Math.min(size.height - padding, point.y));
      }
    }
    points.forEach((point, index) => {
      const marker = markers.current[index], line = lines.current[index];
      if (marker) {
        marker.style.display = point.visible ? "block" : "none";
        marker.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
      }
      if (line) {
        line.style.display = point.visible ? "block" : "none";
        line.setAttribute("x1", String(point.anchorX)); line.setAttribute("y1", String(point.anchorY));
        line.setAttribute("x2", String(point.x)); line.setAttribute("y2", String(point.y));
      }
    });
  });

  return <Html calculatePosition={() => [0, 0]} zIndexRange={[50, 0]} style={{ pointerEvents: "none" }}>
    <div className="checkpoint-fonts absolute left-0 top-0" style={{ width: size.width, height: size.height, pointerEvents: "none" }}>
      <svg aria-hidden width={size.width} height={size.height} className="absolute inset-0 overflow-visible">
        {anchors.map(({ attraction }) => <line key={attraction.id} ref={(element) => { lines.current[attraction.id] = element; }} stroke="#eeeade" strokeWidth="1.25" strokeOpacity="0.65" />)}
      </svg>
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
