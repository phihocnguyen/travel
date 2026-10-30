import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  NearestFilter,
  NoColorSpace,
  SRGBColorSpace,
  type Texture,
} from "three";
import {
  lat2tile,
  lon2tile,
  terrariumToMeters,
  tile2lat,
  tile2lon,
} from "@/lib/geo/mercator";
import { buildAdminLayers } from "@/lib/geo/adminTextures";
import { forEachRing } from "@/lib/geo/polygon";
import type {
  Commune,
  OutlineCollection,
  RegionMeta,
  RiverCollection,
} from "@/lib/geo/types";
import { createProjector, type Projector } from "./projection";

export const TILE_ZOOM = 12;
const MOBILE_TILE_ZOOM = 11;
const DEM_ZOOM = 10;
const TILE_SIZE = 256;
const ADMIN_WIDTH = 1024;
const ADMIN_HEIGHT = 512;

// High-end desktop GPUs get one extra imagery zoom level (roughly 2.5x the
// pixels per kilometre). Mobile and low-memory devices stay on the lighter
// atlas so load time and texture memory remain predictable.
function pickImageryZoom() {
  if (typeof navigator === "undefined") return TILE_ZOOM;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent);
  const lowMemory = (nav.deviceMemory ?? 8) < 6;
  const lowCores = (nav.hardwareConcurrency ?? 8) < 6;
  return mobile || lowMemory || lowCores ? MOBILE_TILE_ZOOM : TILE_ZOOM;
}

type Region = {
  meta: RegionMeta;
  geometry: OutlineCollection["features"][number]["geometry"];
  communes: Commune[];
  rivers: RiverCollection;
};

export type DemSampler = {
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  crop: { x0: number; y0: number; x1: number; y1: number };
  sample: (u: number, v: number) => number;
};

export type MapAssets = {
  projector: Projector;
  meta: RegionMeta;
  geometry: Region["geometry"];
  communes: Commune[];
  rivers: RiverCollection;
  imagery: Texture;
  mask: Texture;
  admin: Texture;
  adminIdTexture: Texture;
  adminIds: Uint16Array;
  adminWidth: number;
  adminHeight: number;
  dem: DemSampler;
  maxHeightMeters: number;
  dispose: () => void;
};

type Crop = { x0: number; y0: number; x1: number; y1: number };

function tileRange(bbox: [number, number, number, number], z: number) {
  const [west, south, east, north] = bbox;
  return {
    xMin: lon2tile(west, z),
    xMax: lon2tile(east, z),
    yMin: lat2tile(north, z),
    yMax: lat2tile(south, z),
  };
}

function atlasCrop(
  bbox: [number, number, number, number],
  range: ReturnType<typeof tileRange>,
  z: number,
  atlasW: number,
  atlasH: number,
): Crop {
  const westLon = tile2lon(range.xMin, z);
  const eastLon = tile2lon(range.xMax + 1, z);
  const northLat = tile2lat(range.yMin, z);
  const southLat = tile2lat(range.yMax + 1, z);
  const x0 = ((bbox[0] - westLon) / (eastLon - westLon)) * atlasW;
  const x1 = ((bbox[2] - westLon) / (eastLon - westLon)) * atlasW;
  const y0 = ((northLat - bbox[3]) / (northLat - southLat)) * atlasH;
  const y1 = ((northLat - bbox[1]) / (northLat - southLat)) * atlasH;
  return {
    x0: Math.max(0, x0),
    y0: Math.max(0, y0),
    x1: Math.min(atlasW, x1),
    y1: Math.min(atlasH, y1),
  };
}

function loadImage(urls: string[], timeoutMs = 12000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    let index = 0;
    let settled = false;

    const finish = (value: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(value);
    };

    const tryNext = () => {
      if (settled) return;
      if (index >= urls.length) {
        finish(null);
        return;
      }
      img.src = urls[index++];
    };

    const timer = window.setTimeout(() => {
      img.src = "";
      finish(null);
    }, timeoutMs);

    img.onload = () => finish(img);
    img.onerror = tryNext;
    tryNext();
  });
}

function imageryUrls(z: number, x: number, y: number) {
  return [
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    `/api/tiles/imagery/${z}/${y}/${x}`,
  ];
}

function demUrls(z: number, x: number, y: number) {
  return [
    `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`,
    `/api/tiles/dem/${z}/${x}/${y}`,
  ];
}

function makeIdTexture(canvas: HTMLCanvasElement) {
  // Nearest filtering is mandatory: linear blending between two commune ids
  // would invent a third, non-existent id along every border.
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function makeMapTexture(
  canvas: HTMLCanvasElement,
  srgb = true,
  mipmaps = true,
) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  // Mipmaps keep the large atlases from thrashing the texture cache when the
  // whole province is visible (the overview is the most common camera state).
  texture.minFilter = mipmaps ? LinearMipmapLinearFilter : LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = mipmaps;
  texture.needsUpdate = true;
  return texture;
}

function fallbackTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const shade = 34 + Math.round(Math.random() * 12);
  ctx.fillStyle = `rgb(${shade + 8}, ${shade + 18}, ${shade - 2})`;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = "rgba(92, 116, 74, 0.25)";
  for (let i = 0; i < 14; i++) {
    const w = 18 + Math.random() * 80;
    const h = 10 + Math.random() * 40;
    ctx.fillRect(
      x + Math.random() * (TILE_SIZE - w),
      y + Math.random() * (TILE_SIZE - h),
      w,
      h,
    );
  }
}

async function runPool(count: number, worker: (index: number) => Promise<void>, limit = 8) {
  let next = 0;
  const runners = Array.from(
    { length: Math.min(limit, count) },
    async () => {
      while (true) {
        const index = next++;
        if (index >= count) return;
        await worker(index);
      }
    },
  );
  await Promise.all(runners);
}

async function buildImagery(
  bbox: [number, number, number, number],
  z: number,
  range: ReturnType<typeof tileRange>,
  onTick: () => void,
) {
  const cols = range.xMax - range.xMin + 1;
  const rows = range.yMax - range.yMin + 1;
  const canvas = document.createElement("canvas");
  canvas.width = cols * TILE_SIZE;
  canvas.height = rows * TILE_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#33422c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let ok = 0;
  await Promise.all(
    Array.from({ length: cols * rows }, async (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = range.xMin + col;
      const y = range.yMin + row;
      const img = await loadImage(imageryUrls(z, x, y));
      if (img) {
        ctx.drawImage(img, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ok++;
      } else {
        fallbackTile(ctx, col * TILE_SIZE, row * TILE_SIZE);
      }
      onTick();
    }),
  );

  if (ok === 0) {
    // No network: paint a soft delta-like fallback so the scene still reads.
    for (let i = 0; i < 260; i++) {
      const w = 20 + Math.random() * 150;
      const h = 8 + Math.random() * 40;
      ctx.fillStyle =
        i % 3 === 0 ? "rgba(74, 96, 58, 0.35)" : "rgba(52, 74, 66, 0.3)";
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        w,
        h,
        Math.random() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  return { canvas, crop: atlasCrop(bbox, range, z, canvas.width, canvas.height) };
}

async function buildDem(
  z: number,
  range: ReturnType<typeof tileRange>,
  bbox: [number, number, number, number],
  onTick: () => void,
) {
  const cols = range.xMax - range.xMin + 1;
  const rows = range.yMax - range.yMin + 1;
  const canvas = document.createElement("canvas");
  canvas.width = cols * TILE_SIZE;
  canvas.height = rows * TILE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  // Terrarium encoding for ~4m sea-level delta, used whenever a tile is missing.
  ctx.fillStyle = "rgb(128, 4, 0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await Promise.all(
    Array.from({ length: cols * rows }, async (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = range.xMin + col;
      const y = range.yMin + row;
      const img = await loadImage(demUrls(z, x, y));
      if (img) {
        ctx.drawImage(img, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
      onTick();
    }),
  );

  const crop = atlasCrop(bbox, range, z, canvas.width, canvas.height);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { width, height, data } = image;

  const sample = (u: number, v: number) => {
    const x = Math.min(
      width - 1,
      Math.max(0, Math.round(crop.x0 + u * (crop.x1 - crop.x0))),
    );
    const y = Math.min(
      height - 1,
      Math.max(0, Math.round(crop.y0 + (1 - v) * (crop.y1 - crop.y0))),
    );
    const p = (y * width + x) * 4;
    return terrariumToMeters(data[p], data[p + 1], data[p + 2]);
  };

  return {
    crop,
    width,
    height,
    pixels: data,
    sample,
  };
}

function buildMaskAndAdmin(
  meta: RegionMeta,
  geometry: Region["geometry"],
  communes: Commune[],
) {
  const [west, south, east, north] = meta.bbox;
  const { overlay, idCanvas, ids } = buildAdminLayers(
    ADMIN_WIDTH,
    ADMIN_HEIGHT,
    west,
    south,
    east,
    north,
    geometry,
    communes,
  );

  return { overlay, idCanvas, ids };
}

function drawProvinceMask(
  geometry: Region["geometry"],
  meta: RegionMeta,
) {
  const canvas = document.createElement("canvas");
  canvas.width = ADMIN_WIDTH;
  canvas.height = ADMIN_HEIGHT;
  const ctx = canvas.getContext("2d")!;
  const [west, south, east, north] = meta.bbox;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  forEachRing(geometry, (ring) => {
    ring.forEach(([lon, lat], i) => {
      const x = ((lon - west) / (east - west)) * canvas.width;
      const y = (1 - (lat - south) / (north - south)) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  });
  ctx.fill("evenodd");
  return canvas;
}

export function applyTextureQuality(assets: MapAssets, maxAnisotropy: number) {
  // Anisotropic filtering is what keeps the satellite atlas crisp when the
  // camera tilts to a grazing angle. Use the hardware maximum (usually 8–16)
  // instead of the old 4x cap.
  const anisotropy = Math.min(8, maxAnisotropy);
  assets.imagery.anisotropy = anisotropy;
  assets.admin.anisotropy = Math.min(4, anisotropy);
  assets.imagery.needsUpdate = true;
  assets.admin.needsUpdate = true;
}

export async function buildMapAssets(
  region: Region,
  onProgress: (p: number) => void,
): Promise<MapAssets> {
  const { meta, geometry, communes, rivers } = region;
  const projector = createProjector(meta.bbox, meta.center);
  const imageryZoom = pickImageryZoom();
  const imageryRange = tileRange(meta.bbox, imageryZoom);
  const demRange = tileRange(meta.bbox, DEM_ZOOM);
  const countFor = (r: ReturnType<typeof tileRange>) =>
    (r.xMax - r.xMin + 1) * (r.yMax - r.yMin + 1);
  const total = countFor(imageryRange) + countFor(demRange) + 4;
  let done = 0;
  const onTick = () => {
    done++;
    onProgress(Math.min(0.94, 0.04 + (done / total) * 0.9));
  };

  onProgress(0.03);
  const [imagery, dem] = await Promise.all([
    buildImagery(meta.bbox, imageryZoom, imageryRange, onTick),
    buildDem(DEM_ZOOM, demRange, meta.bbox, onTick),
  ]);

  onProgress(0.95);
  const { overlay, ids, idCanvas } = buildMaskAndAdmin(
    meta,
    geometry,
    communes,
  );
  onProgress(0.97);

  const provinceMask = drawProvinceMask(geometry, meta);

  const imageryTexture = makeMapTexture(imagery.canvas);
  imageryTexture.offset.set(
    imagery.crop.x0 / imagery.canvas.width,
    1 - imagery.crop.y1 / imagery.canvas.height,
  );
  imageryTexture.repeat.set(
    (imagery.crop.x1 - imagery.crop.x0) / imagery.canvas.width,
    (imagery.crop.y1 - imagery.crop.y0) / imagery.canvas.height,
  );

  const maskTexture = makeMapTexture(provinceMask, false);
  const adminTexture = makeMapTexture(overlay);
  const adminIdTexture = makeIdTexture(idCanvas);
  onProgress(1);

  let maxHeightMeters = 0;
  for (let y = 0; y <= 48; y++) {
    for (let x = 0; x <= 96; x++) {
      maxHeightMeters = Math.max(maxHeightMeters, dem.sample(x / 96, y / 48));
    }
  }
  maxHeightMeters = Math.max(8, maxHeightMeters);

  return {
    projector,
    meta,
    geometry,
    communes,
    rivers,
    imagery: imageryTexture,
    mask: maskTexture,
    admin: adminTexture,
    adminIdTexture,
    adminIds: ids,
    adminWidth: ADMIN_WIDTH,
    adminHeight: ADMIN_HEIGHT,
    dem,
    maxHeightMeters,
    dispose() {
      imageryTexture.dispose();
      maskTexture.dispose();
      adminTexture.dispose();
      adminIdTexture.dispose();
    },
  };
}
