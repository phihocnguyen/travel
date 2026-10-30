import { lonLatToMeters } from "@/lib/geo/mercator";

export type Bbox = [number, number, number, number];

export type Projector = {
  bbox: Bbox;
  center: [number, number];
  widthKm: number;
  depthKm: number;
  toLocal: (lon: number, lat: number) => [number, number];
  toUv: (lon: number, lat: number) => [number, number];
  fromUv: (u: number, v: number) => [number, number];
};

export function createProjector(
  bbox: Bbox,
  center: [number, number],
): Projector {
  const [west, south, east, north] = bbox;
  const [cx, cy] = lonLatToMeters(center[0], center[1]);
  const [westX] = lonLatToMeters(west, south);
  const [eastX] = lonLatToMeters(east, south);
  const [, southY] = lonLatToMeters(west, south);
  const [, northY] = lonLatToMeters(west, north);

  return {
    bbox,
    center,
    widthKm: (eastX - westX) / 1000,
    depthKm: (northY - southY) / 1000,
    toLocal(lon, lat) {
      const [x, y] = lonLatToMeters(lon, lat);
      return [(x - cx) / 1000, -(y - cy) / 1000];
    },
    toUv(lon, lat) {
      return [(lon - west) / (east - west), (lat - south) / (north - south)];
    },
    fromUv(u, v) {
      return [west + u * (east - west), south + v * (north - south)];
    },
  };
}
