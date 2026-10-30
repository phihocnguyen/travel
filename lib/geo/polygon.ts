export type Ring = number[][];
export type Polygon = Ring[];
export type MultiPolygon = Polygon[];

export type GeoGeometry =
  | { type: "Polygon"; coordinates: Polygon }
  | { type: "MultiPolygon"; coordinates: MultiPolygon };

function ringContains(ring: Ring, lon: number, lat: number) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonContains(poly: Polygon, lon: number, lat: number) {
  if (!poly.length || !ringContains(poly[0], lon, lat)) return false;
  for (let i = 1; i < poly.length; i++) {
    if (ringContains(poly[i], lon, lat)) return false;
  }
  return true;
}

export function geometryContains(geom: GeoGeometry, lon: number, lat: number) {
  if (geom.type === "Polygon") return polygonContains(geom.coordinates, lon, lat);
  return geom.coordinates.some((poly) => polygonContains(poly, lon, lat));
}

export function forEachRing(
  geom: GeoGeometry,
  fn: (ring: Ring, isHole: boolean) => void,
) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  for (const poly of polys) {
    poly.forEach((ring, i) => fn(ring, i > 0));
  }
}
