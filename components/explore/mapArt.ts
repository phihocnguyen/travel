// Small local SVG assets are rasterized once. The animation loop only copies
// ready bitmaps; it never parses SVGs or requests images while drawing.
const FILES = {
  grass: "map-grass.svg", earth: "map-earth.svg", water: "map-water.svg",
  tree: "map-tree.svg", tram: "map-tram.svg", palm: "map-palm.svg",
  house: "map-house.svg", hut: "map-hut.svg", temple: "map-temple.svg",
  memorial: "map-memorial.svg", lotus: "map-lotus.svg", mango: "mango-ripe.svg",
} as const;
type Art = keyof typeof FILES;
const bitmaps: Partial<Record<Art, HTMLCanvasElement>> = {};
const patterns = new WeakMap<CanvasRenderingContext2D, Partial<Record<Art, CanvasPattern>>>();
let loading: Promise<void> | null = null;

export function loadMapArt(): Promise<void> {
  if (loading) return loading;
  loading = Promise.all((Object.keys(FILES) as Art[]).map(async key => {
    try {
      const image = new Image(); image.src = `/explore/${FILES[key]}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (context) { context.drawImage(image, 0, 0); bitmaps[key] = canvas; }
    } catch { /* Keep the existing drawing if an asset cannot be loaded. */ }
  })).then(() => undefined);
  return loading;
}

export function mapPattern(context: CanvasRenderingContext2D, key: Art): CanvasPattern | null {
  const bitmap = bitmaps[key]; if (!bitmap) return null;
  let cached = patterns.get(context);
  if (!cached) { cached = {}; patterns.set(context, cached); }
  if (!cached[key]) { const pattern = context.createPattern(bitmap, "repeat"); if (pattern) cached[key] = pattern; }
  return cached[key] ?? null;
}

export function mapTexture(context: CanvasRenderingContext2D, key: Art, x: number, y: number, width: number, height: number, fallback: string) {
  context.fillStyle = mapPattern(context, key) ?? fallback;
  context.fillRect(x, y, width, height);
}

export function mapSprite(context: CanvasRenderingContext2D, key: Art, x: number, y: number, width: number, height: number): boolean {
  const bitmap = bitmaps[key]; if (!bitmap) return false;
  context.drawImage(bitmap, x, y, width, height); return true;
}
