"use client";

import { useLayoutEffect, useMemo, useRef } from "react";

import { Color, InstancedMesh, Matrix4, Quaternion, Vector3 } from "three";
import type { MapAssets } from "@/lib/map/assets";
import { ATTRACTIONS } from "@/lib/map/attractions";
import { elevationToScene } from "@/components/map/Terrain";
import { useMapUI } from "@/components/map/MapUIContext";

// Decorative grove clusters, deliberately separated from checkpoint markers.
// Production: supply polygon orchard masks from verified land-use data instead.
const GROVE_CONFIG = { patches: 4, treesPerPatch: 52 };
const rotation = new Quaternion();
const matrix = new Matrix4();
const position = new Vector3();
const size = new Vector3();
const leafColors = ["#497740", "#568847", "#648e4a", "#436d39", "#719653"];

function random(seed: number) {
  const v = Math.sin(seed * 127.1 + 19.43) * 43758.5453;
  return v - Math.floor(v);
}

function computeTrees(assets: MapAssets) {
  const { projector, dem } = assets;
  const width = projector.widthKm;
  const depth = projector.depthKm;
  const existingMango = ATTRACTIONS.filter((a) => /xoài|mango/i.test(`${a.name} ${a.category}`));
  // Fallback regions are *illustrative* and not claims about real land use.
  const anchors = existingMango.length
    ? existingMango.map((a) => projector.toLocal(a.lon, a.lat))
    : [[-width * 0.22, -depth * 0.18], [width * 0.2, -depth * 0.1], [-width * 0.11, depth * 0.21], [width * 0.24, depth * 0.22]];
  const radius = Math.max(1.0, Math.min(width, depth) * 0.046);
  const treeScale = Math.max(0.12, Math.min(width, depth) * 0.0031);
  let maskData: Uint8ClampedArray | undefined;
  let maskW = 0;
  let maskH = 0;
  try {
    const img = assets.mask.image as CanvasImageSource & { width: number; height: number };
    maskW = img.width;
    maskH = img.height;
    if (maskW && maskH) {
      const canvas = document.createElement("canvas");
      canvas.width = maskW;
      canvas.height = maskH;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context?.drawImage(img, 0, 0);
      maskData = context?.getImageData(0, 0, maskW, maskH).data;
    }
  } catch { /* The map may use a non-readable remote texture. */ }
  const trees: { x: number; y: number; z: number; s: number; color: string }[] = [];

  for (let patch = 0; patch < Math.min(GROVE_CONFIG.patches, anchors.length); patch++) {
    const [cx, cz] = anchors[patch];
    for (let j = 0; j < GROVE_CONFIG.treesPerPatch; j++) {
      const seed = patch * 157 + j;
      const angle = random(seed + 1) * Math.PI * 2;
      const distance = Math.sqrt(random(seed + 2)) * radius;
      const x = cx + Math.cos(angle) * distance;
      const z = cz + Math.sin(angle) * distance;
      const u = x / width + 0.5;
      const v = 0.5 - z / depth;
      if (u < 0.07 || u > 0.93 || v < 0.07 || v > 0.93) continue;
      if (maskData) {
        const ix = Math.min(maskW - 1, Math.floor(u * maskW));
        const iy = Math.min(maskH - 1, Math.floor((1 - v) * maskH));
        if (maskData[(iy * maskW + ix) * 4 + 1] < 115) continue;
      }
      // Avoid the immediate marker area.
      if (ATTRACTIONS.some((a) => {
        const [mx, mz] = projector.toLocal(a.lon, a.lat);
        return Math.hypot(x - mx, z - mz) < treeScale * 4;
      })) continue;
      trees.push({
        x,
        y: elevationToScene(dem.sample(u, v)),
        z,
        s: treeScale * (0.75 + random(seed + 3) * 0.55),
        color: leafColors[Math.floor(random(seed + 4) * leafColors.length)],
      });
    }
  }
  return trees;
}

export function MangoGroves({ assets }: { assets: MapAssets }) {
  const { season } = useMapUI();
  const trees = useMemo(() => computeTrees(assets), [assets]);
  const trunkRef = useRef<InstancedMesh>(null);
  const leavesRef = useRef<InstancedMesh>(null);
  const fruitRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const brown = new Color("#8a6040");
    const gold = new Color("#dfb948");
    trees.forEach((tree, i) => {
      const s = tree.s;
      position.set(tree.x, tree.y + s * 1.2, tree.z);
      size.set(s * 0.25, s * 2.4, s * 0.25);
      matrix.compose(position, rotation, size);
      trunkRef.current?.setMatrixAt(i, matrix);
      trunkRef.current?.setColorAt(i, brown);

      position.set(tree.x, tree.y + s * 2.9, tree.z);
      size.set(s * 1.65, s * 1.15, s * 1.55);
      matrix.compose(position, rotation, size);
      leavesRef.current?.setMatrixAt(i, matrix);
      leavesRef.current?.setColorAt(i, new Color(tree.color));

      position.set(tree.x + s * 0.56, tree.y + s * 2.35, tree.z + s * 0.5);
      size.set(s * 0.16, s * 0.23, s * 0.16);
      matrix.compose(position, rotation, size);
      fruitRef.current?.setMatrixAt(i, matrix);
      fruitRef.current?.setColorAt(i, gold);
    });
    [trunkRef.current, leavesRef.current, fruitRef.current].forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [trees]);

  return (
    <group visible={season === "mango"}>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, trees.length]} frustumCulled={false} raycast={() => null}>
        <cylinderGeometry args={[0.48, 0.65, 1, 6]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={leavesRef} args={[undefined, undefined, trees.length]} frustumCulled={false} raycast={() => null}>
        <icosahedronGeometry args={[1, 1]} />
        <meshLambertMaterial vertexColors flatShading />
      </instancedMesh>
      <instancedMesh ref={fruitRef} args={[undefined, undefined, trees.length]} frustumCulled={false} raycast={() => null}>
        <sphereGeometry args={[1, 5, 5]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
    </group>
  );
}
