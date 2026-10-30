type Params = { params: Promise<{ z: string; x: string; y: string }> };

function parseTile(z: string, x: string, y: string) {
  const zoom = Number(z);
  const tileX = Number(x);
  const tileY = Number(y);
  if (
    !Number.isInteger(zoom) ||
    zoom < 0 ||
    zoom > 15 ||
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
  const { z, x, y } = await params;
  const tile = parseTile(z, x, y);
  if (!tile) return new Response("invalid tile", { status: 400 });

  const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${tile.zoom}/${tile.tileX}/${tile.tileY}.png`;
  const upstream = await fetch(url, {
    headers: { "User-Agent": "DongThapCinematicMap/1.0" },
  });
  if (!upstream.ok) {
    return new Response("tile error", { status: upstream.status });
  }
  const buf = await upstream.arrayBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
