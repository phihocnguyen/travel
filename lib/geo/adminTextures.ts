import { forEachRing, geometryContains, type GeoGeometry } from "./polygon";
import type { Commune } from "./types";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function projectToUv(
  lon: number,
  lat: number,
  west: number,
  south: number,
  east: number,
  north: number,
) {
  return {
    u: (lon - west) / (east - west),
    v: (lat - south) / (north - south),
  };
}

export function buildAdminLayers(
  width: number,
  height: number,
  west: number,
  south: number,
  east: number,
  north: number,
  geometry: GeoGeometry,
  communes: Commune[],
) {
  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const mctx = mask.getContext("2d")!;
  mctx.fillStyle = "#000";
  mctx.fillRect(0, 0, width, height);
  mctx.fillStyle = "#fff";
  mctx.beginPath();
  forEachRing(geometry, (ring, isHole) => {
    ring.forEach(([lon, lat], i) => {
      const { u, v } = projectToUv(lon, lat, west, south, east, north);
      const x = u * width;
      const y = (1 - v) * height;
      if (i === 0) mctx.moveTo(x, y);
      else mctx.lineTo(x, y);
    });
    if (isHole) {
      /* even-odd fill handles holes if we continue the path */
    }
  });
  mctx.closePath();
  mctx.fill("evenodd");

  const overlay = document.createElement("canvas");
  overlay.width = width;
  overlay.height = height;
  const octx = overlay.getContext("2d")!;
  const img = octx.createImageData(width, height);
  const ids = new Uint16Array(width * height);
  const maskData = mctx.getImageData(0, 0, width, height).data;
  const colors = communes.map((c) => hexToRgb(c.color));

  for (let y = 0; y < height; y++) {
    const lat = north - ((y + 0.5) / height) * (north - south);
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      if (maskData[p] < 40) continue;
      const lon = west + ((x + 0.5) / width) * (east - west);
      if (!geometryContains(geometry, lon, lat)) continue;
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < communes.length; i++) {
        const dx = communes[i].lon - lon;
        const dy = communes[i].lat - lat;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      const [r, g, b] = colors[best];
      img.data[p] = r;
      img.data[p + 1] = g;
      img.data[p + 2] = b;
      img.data[p + 3] = 120;
      ids[y * width + x] = best + 1;
    }
  }
  octx.putImageData(img, 0, 0);

  const idCanvas = document.createElement("canvas");
  idCanvas.width = width;
  idCanvas.height = height;
  const ictx = idCanvas.getContext("2d")!;
  const idImg = ictx.createImageData(width, height);
  for (let i = 0; i < ids.length; i++) {
    const v = ids[i];
    idImg.data[i * 4] = v;
    idImg.data[i * 4 + 3] = v ? 255 : 0;
  }
  ictx.putImageData(idImg, 0, 0);

  return { mask, overlay, idCanvas, ids };
}

export function idAt(
  ids: Uint16Array,
  width: number,
  height: number,
  u: number,
  v: number,
) {
  const x = Math.min(width - 1, Math.max(0, Math.floor(u * width)));
  const y = Math.min(height - 1, Math.max(0, Math.floor((1 - v) * height)));
  const id = ids[y * width + x];
  return id === 0 ? null : id - 1;
}
