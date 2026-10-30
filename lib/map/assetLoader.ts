import { buildMapAssets, type MapAssets } from "./assets";
import { loadRegion } from "@/lib/geo/loadRegion";

let assetsPromise: Promise<MapAssets> | null = null;
let reported = 0;
const listeners = new Set<(progress: number) => void>();

function report(progress: number) {
  // Throttle context updates: the loader only needs a few ticks per second.
  if (progress < 1 && progress - reported < 0.02) return;
  reported = progress;
  listeners.forEach((listener) => listener(progress));
}

export function loadMapAssetsOnce(onProgress: (progress: number) => void) {
  listeners.add(onProgress);
  onProgress(reported);

  if (!assetsPromise) {
    assetsPromise = loadRegion()
      .then((region) => buildMapAssets(region, report))
      .catch((error: unknown) => {
        assetsPromise = null;
        reported = 0;
        throw error;
      });
  }

  return assetsPromise;
}

export function unsubscribeMapAssets(onProgress: (progress: number) => void) {
  listeners.delete(onProgress);
}
