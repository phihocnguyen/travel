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
            <div className="neighbor-label">
              <span className="neighbor-label__dot" />
              {neighbor.name}
            </div>
          </Html>
        );
      })}
    </>
  );
}
