"use client";

import { useEffect } from "react";
import { Html } from "@react-three/drei";
import type { MapAssets } from "@/lib/map/assets";
import { useMapUI } from "./MapUIContext";

type Props = {
  assets: MapAssets;
  y: number;
};

/**
 * The commune zone itself is tinted and outlined inside the terrain shader.
 * This component only owns the DOM tooltip that follows the hovered commune.
 */
export function AdminOverlay({ assets, y }: Props) {
  const { hoveredId } = useMapUI();
  const active = hoveredId == null ? null : assets.communes[hoveredId];

  useEffect(() => {
    document.body.style.cursor = hoveredId != null ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hoveredId]);

  const activePos = active
    ? assets.projector.toLocal(active.lon, active.lat)
    : null;

  if (!active || !activePos) return null;

  return (
    <Html
      position={[activePos[0], y + 0.4, activePos[1]]}
      center
      zIndexRange={[40, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div className="admin-tooltip">
        <span className="admin-tooltip__kind">{active.kind}</span>
        <span className="admin-tooltip__name">{active.name}</span>
      </div>
    </Html>
  );
}
