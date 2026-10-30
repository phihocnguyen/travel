type Params = { params: Promise<{ z: string; y: string; x: string }> };

function parseTile(z: string, x: string, y: string) {
  const zoom = Number(z);
  const tileX = Number(x);
  const tileY = Number(y);
  if (
    !Number.isInteger(zoom) ||
    zoom < 0 ||
    zoom > 19 ||
    !Number.isInteger(tileX) ||
    !Number.isInteger(tileY)
  ) {
    return null;
  }
  const max = 2 ** zoom;
  if (tileX < 0 || tileY < 0 || tileX >= max || tileY >= max) return null;
  return { zoom, tileX, tileY };
}

export async function GET(_req: Request, { params }: Params) {
  const { z, y, x } = await params;
  const tile = parseTile(z, x, y);
  if (!tile) return new Response("invalid tile", { status: 400 });

  const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${tile.zoom}/${tile.tileY}/${tile.tileX}`;
  const upstream = await fetch(url, {
    headers: { "User-Agent": "DongThapCinematicMap/1.0" },
  });
  if (!upstream.ok) {
    return new Response("tile error", { status: upstream.status });
  }
  const buf = await upstream.arrayBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
