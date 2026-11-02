"use client";

import { Html } from "@react-three/drei";
import type { Projector } from "@/lib/map/projection";
import type { Neighbor } from "@/lib/geo/types";

type Props = {
  projector: Projector;
  neighbors: Neighbor[];
  y: number;
};

export function NeighborLabels({ projector, neighbors, y }: Props) {
  return (
    <>
      {neighbors.map((neighbor) => {
        const [x, z] = projector.toLocal(neighbor.lon, neighbor.lat);
        return (
          <Html
            key={neighbor.name}
            position={[x, y, z]}
            center
            zIndexRange={[20, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div className="flex items-center gap-2 rounded-full border border-forest/10 bg-cream/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-forest shadow-card backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-mango" />
              {neighbor.name}
            </div>
          </Html>
        );
      })}
    </>
  );
}
