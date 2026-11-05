"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { CanvasTexture, InstancedMesh, Matrix4, SRGBColorSpace, Vector3 } from "three";
import type { MapAssets } from "@/lib/map/assets";
import { geometryContains } from "@/lib/geo/polygon";
import { ATTRACTIONS } from "@/lib/map/attractions";
import { elevationToScene } from "@/components/map/Terrain";
import { useMapUI } from "@/components/map/MapUIContext";

// Illustrative orchard coverage around the named localities, not cadastral
// boundaries. Keep the older locality names even where communes have merged.
export const MANGO_GROWING_AREAS = [
  { name: "Mỹ Thọ", lon: 105.6952, lat: 10.4435 },
  { name: "Mỹ Xương", lon: 105.7474, lat: 10.4492 },
  { name: "Hoà An", lon: 105.646, lat: 10.434 },
  { name: "Tân Thuận Đông", lon: 105.6049, lat: 10.4788 },
  { name: "Tân Thuận Tây", lon: 105.613, lat: 10.453 },
  { name: "Tịnh Thới", lon: 105.625, lat: 10.418 },
] as const;

function random(seed: number) {
  const value = Math.sin(seed * 127.1 + 19.43) * 43758.5453;
  return value - Math.floor(value);
}

function makeMangoTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  // Use the familiar full-color mango glyph for a softer, readable map icon.
  ctx.font = '184px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("\u{1F96D}", 128, 136);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function MangoGroves({ assets }: { assets: MapAssets }) {
  const { season } = useMapUI();
  const mesh = useRef<InstancedMesh>(null);
  const texture = useMemo(() => makeMangoTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);

  const icons = useMemo(() => {
    const { projector, dem, geometry } = assets;
    const iconSize = Math.min(projector.widthKm, projector.depthKm) * 0.008;
    const checkpoints = ATTRACTIONS.map(a => projector.toLocal(a.lon, a.lat));
    const points: { x: number; y: number; z: number; scale: number }[] = [];
    function add(lon: number, lat: number, seed: number) {
      if (!geometryContains(geometry, lon, lat)) return false;
      const [x, z] = projector.toLocal(lon, lat);
      if (checkpoints.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < iconSize * 1.15)) return false;
      if (points.some(p => Math.hypot(x - p.x, z - p.z) < iconSize * 0.85)) return false;
      const u = x / projector.widthKm + 0.5;
      const v = 0.5 - z / projector.depthKm;
      points.push({ x, z, y: elevationToScene(dem.sample(u, v)) + 0.15, scale: iconSize * (0.9 + random(seed + 4) * 0.2) });
      return true;
    }
    // Dense coverage: up to 18 spaced icons per priority locality.
    MANGO_GROWING_AREAS.forEach((area, index) => {
      let count = 0;
      for (let attempt = 0; attempt < 500 && count < 18; attempt++) {
        const seed = index * 1009 + attempt * 7;
        const angle = random(seed + 1) * Math.PI * 2;
        const radius = Math.sqrt(random(seed + 2));
        if (add(area.lon + Math.cos(angle) * radius * 0.019,
          area.lat + Math.sin(angle) * radius * 0.016, seed)) count++;
      }
    });
    // Other communes receive just one scattered icon, outside the dense belts.
    assets.communes.forEach((commune, index) => {
      if (MANGO_GROWING_AREAS.some(area =>
        Math.hypot((commune.lon - area.lon) / 0.026, (commune.lat - area.lat) / 0.023) < 1.5)) return;
      for (let attempt = 0; attempt < 12; attempt++) {
        const seed = 20000 + index * 103 + attempt * 7;
        if (add(commune.lon + (random(seed) - 0.5) * 0.012,
          commune.lat + (random(seed + 1) - 0.5) * 0.012, seed)) break;
      }
    });
    return points;
  }, [assets]);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const matrix = new Matrix4();
    const scale = new Vector3();
    icons.forEach((icon, index) => {
      matrix.makeRotationX(-Math.PI / 2);
      matrix.scale(scale.set(icon.scale, icon.scale, 1));
      matrix.setPosition(icon.x, icon.y, icon.z);
      mesh.current!.setMatrixAt(index, matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [icons]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, icons.length]}
      visible={season === "mango"} frustumCulled={false} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.05} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}
