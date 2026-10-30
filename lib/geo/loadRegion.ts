import type {
  Commune,
  OutlineCollection,
  RegionMeta,
  RiverCollection,
} from "./types";
import type { GeoGeometry } from "./polygon";

export async function loadRegion() {
  const [meta, outline, communes, rivers] = await Promise.all([
    fetch("/geo/meta.json").then((r) => r.json() as Promise<RegionMeta>),
    fetch("/geo/outline.geojson").then((r) => r.json() as Promise<OutlineCollection>),
    fetch("/geo/communes.json").then((r) => r.json() as Promise<Commune[]>),
    fetch("/geo/rivers.geojson").then((r) => r.json() as Promise<RiverCollection>),
  ]);
  const geometry = outline.features[0].geometry as GeoGeometry;
  return { meta, geometry, communes, rivers };
}
