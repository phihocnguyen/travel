"use client";

import { useLayoutEffect, useMemo, useRef } from "react";

import { Color, Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from "three";
import type { MapAssets } from "@/lib/map/assets";
import { ATTRACTIONS } from "@/lib/map/attractions";
import { elevationToScene } from "@/components/map/Terrain";
import { useMapUI } from "@/components/map/MapUIContext";

// Decorative mango groves. These are illustrative orchard clusters, not a
// cadastral land-use layer. Each tree is a small mesh (trunk, limbs, canopy
// lobes and fruit) so the mango season reads as a real landscape rather than
// a flat marker icon.
const GROVE_CONFIG = { patches: 6, treesPerPatch: 68 };
const BRANCHES_PER_TREE = 3;
const LOBES_PER_TREE = 3;
const FRUIT_PER_TREE = 3;

// Real orchard belts around Sa Dec, Cao Lanh, Cai Be and Thap Muoi. Used only
// when no attraction is tagged as a mango destination.
const FALLBACK_ORCHARDS: [number, number][] = [
  [105.762, 10.298],
  [105.648, 10.452],
  [106.012, 10.352],
  [105.838, 10.604],
  [105.718, 10.348],
  [105.905, 10.452],
];

const rotation = new Quaternion();
const matrix = new Matrix4();
const position = new Vector3();
const size = new Vector3();
const branchRotation = new Quaternion();
const branchEuler = new Euler();
const leafColors = ["#497740", "#568847", "#648e4a", "#436d39", "#719653", "#3d6636"];

function random(seed: number) {
  const v = Math.sin(seed * 127.1 + 19.43) * 43758.5453;
  return v - Math.floor(v);
}

type GroveTree = {
  x: number;
  y: number;
  z: number;
  s: number;
  color: string;
  seed: number;
};

function computeTrees(assets: MapAssets): GroveTree[] {
  const { projector, dem } = assets;
  const width = projector.widthKm;
  const depth = projector.depthKm;
  const mangoAttractions = ATTRACTIONS.filter((a) =>
    /xoài|mango|orchard|grove/i.test(`${a.name} ${a.category}`),
  );
  const anchors: [number, number][] = mangoAttractions.length
    ? mangoAttractions.map((a) => projector.toLocal(a.lon, a.lat))
    : FALLBACK_ORCHARDS.map(([lon, lat]) => projector.toLocal(lon, lat));

  const radius = Math.max(1.4, Math.min(width, depth) * 0.055);
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

  const trees: GroveTree[] = [];
  for (let patch = 0; patch < Math.min(GROVE_CONFIG.patches, anchors.length); patch++) {
    const [cx, cz] = anchors[patch];
    for (let j = 0; j < GROVE_CONFIG.treesPerPatch; j++) {
      const seed = patch * 401 + j;
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
      // Leave breathing room around the checkpoint markers.
      if (ATTRACTIONS.some((a) => {
        const [mx, mz] = projector.toLocal(a.lon, a.lat);
        return Math.hypot(x - mx, z - mz) < treeScale * 5;
      })) continue;
      trees.push({
        x,
        y: elevationToScene(dem.sample(u, v)),
        z,
        s: treeScale * (0.72 + random(seed + 3) * 0.62),
        color: leafColors[Math.floor(random(seed + 4) * leafColors.length)],
        seed,
      });
    }
  }
  return trees;
}

export function MangoGroves({ assets }: { assets: MapAssets }) {
  const { season } = useMapUI();
  const trees = useMemo(() => computeTrees(assets), [assets]);
  const trunkRef = useRef<InstancedMesh>(null);
  const branchRef = useRef<InstancedMesh>(null);
  const leavesRef = useRef<InstancedMesh>(null);
  const fruitRef = useRef<InstancedMesh>(null);
  const width = assets.projector.widthKm;
  const depth = assets.projector.depthKm;

  useLayoutEffect(() => {
    const brown = new Color("#7a5637");
    const branchColor = new Color("#8a6040");
    const gold = new Color("#e8b63e");
    const leaf = new Color();
    // Ripe mango foliage: warm golden-yellow crowns with a few deeper olive
    // notes so the groves still read as living trees, not flat yellow blobs.
    const mangoLeaves = ["#d4b23a", "#e0c14a", "#caa22c", "#e8cd5c", "#b99322", "#d9b943"];
    trees.forEach((tree, i) => {
      const s = tree.s;
      const seed = tree.seed;

      // Trunk: slightly tapered, leaning with the grove.
      position.set(tree.x, tree.y + s * 1.05, tree.z);
      branchEuler.set((random(seed + 9) - 0.5) * 0.1, random(seed + 10) * Math.PI, (random(seed + 11) - 0.5) * 0.1);
      rotation.setFromEuler(branchEuler);
      size.set(s * 0.22, s * 2.1, s * 0.22);
      matrix.compose(position, rotation, size);
      trunkRef.current?.setMatrixAt(i, matrix);
      trunkRef.current?.setColorAt(i, brown);

      // Limbs: three angled branches from the crown of the trunk.
      for (let b = 0; b < BRANCHES_PER_TREE; b++) {
        const index = i * BRANCHES_PER_TREE + b;
        const heading = random(seed + 20 + b) * Math.PI * 2;
        const tilt = 0.55 + random(seed + 30 + b) * 0.35;
        position.set(
          tree.x + Math.cos(heading) * s * 0.55,
          tree.y + s * (2.0 + b * 0.22),
          tree.z + Math.sin(heading) * s * 0.55,
        );
        branchEuler.set(tilt, heading, 0, "YXZ");
        branchRotation.setFromEuler(branchEuler);
        size.set(s * 0.09, s * 0.95, s * 0.09);
        matrix.compose(position, branchRotation, size);
        branchRef.current?.setMatrixAt(index, matrix);
        branchRef.current?.setColorAt(index, branchColor);
      }

      // Canopy: three overlapping lobes give the tree a full, rounded silhouette.
      for (let l = 0; l < LOBES_PER_TREE; l++) {
        const index = i * LOBES_PER_TREE + l;
        const heading = (l / LOBES_PER_TREE) * Math.PI * 2 + random(seed + 40) * 0.9;
        const spread = l === 0 ? 0 : s * (0.55 + random(seed + 41 + l) * 0.35);
        position.set(
          tree.x + Math.cos(heading) * spread,
          tree.y + s * (2.75 + l * 0.18 + random(seed + 50 + l) * 0.16),
          tree.z + Math.sin(heading) * spread,
        );
        branchEuler.set(random(seed + 60 + l) * 0.35, heading, random(seed + 70 + l) * 0.35);
        rotation.setFromEuler(branchEuler);
        const lobe = s * (l === 0 ? 1.3 : 0.9 + random(seed + 80 + l) * 0.22);
        size.set(lobe * 1.12, lobe * 0.82, lobe * 1.02);
        matrix.compose(position, rotation, size);
        leavesRef.current?.setMatrixAt(index, matrix);
        leaf.set(mangoLeaves[Math.floor(random(tree.seed + 120 + l) * mangoLeaves.length)]);
        leaf.multiplyScalar(0.86 + l * 0.06);
        leavesRef.current?.setColorAt(index, leaf);
      }

      // A few visible mangoes hanging under the crown.
      for (let f = 0; f < FRUIT_PER_TREE; f++) {
        const index = i * FRUIT_PER_TREE + f;
        const heading = random(seed + 90 + f) * Math.PI * 2;
        const spread = s * (0.55 + random(seed + 100 + f) * 0.4);
        position.set(
          tree.x + Math.cos(heading) * spread,
          tree.y + s * (2.3 + random(seed + 110 + f) * 0.55),
          tree.z + Math.sin(heading) * spread,
        );
        rotation.identity();
        size.set(s * 0.13, s * 0.19, s * 0.13);
        matrix.compose(position, rotation, size);
        fruitRef.current?.setMatrixAt(index, matrix);
        fruitRef.current?.setColorAt(index, gold);
      }
    });
    [trunkRef.current, branchRef.current, leavesRef.current, fruitRef.current].forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [trees]);

  if (!trees.length) return null;

  return (
    <group visible={season === "mango"}>
      {/* The scene has no global lights (terrain and markers are unlit shaders),
          so the grove brings its own soft key light; otherwise Lambert
          materials would render black. */}
      <ambientLight intensity={2.2} color="#e8efd9" />
      <directionalLight
        position={[-width * 0.35, 70, depth * 0.3]}
        intensity={2.4}
        color="#fff0c8"
      />
      <instancedMesh
        ref={trunkRef}
        args={[undefined, undefined, trees.length]}
        frustumCulled={false}
        raycast={() => null}
      >
        <cylinderGeometry args={[0.42, 0.62, 1, 7]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh
        ref={branchRef}
        args={[undefined, undefined, trees.length * BRANCHES_PER_TREE]}
        frustumCulled={false}
        raycast={() => null}
      >
        <cylinderGeometry args={[0.42, 0.62, 1, 5]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh
        ref={leavesRef}
        args={[undefined, undefined, trees.length * LOBES_PER_TREE]}
        frustumCulled={false}
        raycast={() => null}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh
        ref={fruitRef}
        args={[undefined, undefined, trees.length * FRUIT_PER_TREE]}
        frustumCulled={false}
        raycast={() => null}
      >
        <sphereGeometry args={[1, 6, 6]} />
        <meshLambertMaterial />
      </instancedMesh>
    </group>
  );
}
