"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { CanvasTexture, Color, InstancedMesh, Matrix4, SRGBColorSpace } from "three";
import type { MapAssets } from "@/lib/map/assets";

const TREE_COUNT = 450;
function random(seed: number) {
  const value = Math.sin(seed * 127.1 + 91.7) * 43758.5453;
  return value - Math.floor(value);
}

function makeGroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#223629";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1600; i++) {
    const x = random(i * 7 + 1) * 512;
    const y = random(i * 7 + 2) * 512;
    const r = 2 + random(i * 7 + 3) * 18;
    ctx.fillStyle = i % 4 === 0 ? "rgba(120,143,85,.08)" : "rgba(7,25,18,.12)";
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.7, r, random(i * 7 + 4) * 6.28, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function Outskirts({ assets }: { assets: MapAssets }) {
  const { widthKm: width, depthKm: depth } = assets.projector;
  const crowns = useRef<InstancedMesh>(null);
  const trunks = useRef<InstancedMesh>(null);
  const ground = useMemo(() => makeGroundTexture(), []);
  useEffect(() => () => ground.dispose(), [ground]);
  const trees = useMemo(() => {
    const result: { x: number; z: number; scale: number; tint: string }[] = [];
    for (let i = 0; i < TREE_COUNT * 3 && result.length < TREE_COUNT; i++) {
      const x = (random(i * 5 + 1) - .5) * width * 2.8;
      const z = (random(i * 5 + 2) - .5) * depth * 2.8;
      // Keep the geographic map free of illustrative trees.
      if (Math.abs(x) < width * .55 && Math.abs(z) < depth * .55) continue;
      const edge = Math.max(Math.abs(x) / width, Math.abs(z) / depth);
      if (random(i * 5 + 3) > Math.max(.2, .85 - edge * .25)) continue;
      result.push({ x, z, scale: .6 + random(i * 5 + 4) * 1.3, tint: ["#385b3b", "#527547", "#6d8250", "#2e5039"][i % 4] });
    }
    return result;
  }, [width, depth]);
  useLayoutEffect(() => {
    if (!crowns.current || !trunks.current) return;
    const matrix = new Matrix4();
    for (let i = 0; i < trees.length; i++) {
      const tree = trees[i];
      matrix.makeScale(tree.scale * .75, tree.scale * 1.6, tree.scale * .75);
      matrix.setPosition(tree.x, tree.scale * 1.8, tree.z);
      crowns.current.setMatrixAt(i, matrix);
      crowns.current.setColorAt(i, new Color(tree.tint));
      matrix.makeScale(tree.scale * .12, tree.scale * .7, tree.scale * .12);
      matrix.setPosition(tree.x, tree.scale * .35, tree.z);
      trunks.current.setMatrixAt(i, matrix);
    }
    crowns.current.instanceMatrix.needsUpdate = true;
    trunks.current.instanceMatrix.needsUpdate = true;
    if (crowns.current.instanceColor) crowns.current.instanceColor.needsUpdate = true;
  }, [trees]);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} raycast={() => null}>
      <planeGeometry args={[width * 3.2, depth * 3.2]} />
      <meshBasicMaterial map={ground} toneMapped />
    </mesh>
    <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} frustumCulled={false} raycast={() => null}>
      <cylinderGeometry args={[.5, .7, 1, 5]} />
      <meshLambertMaterial color="#776a4b" />
    </instancedMesh>
    <instancedMesh ref={crowns} args={[undefined, undefined, trees.length]} frustumCulled={false} raycast={() => null}>
      <coneGeometry args={[1, 1, 5]} />
      <meshLambertMaterial color="white" />
    </instancedMesh>
    <ambientLight intensity={1.1} />
    <directionalLight position={[-35, 80, 25]} intensity={1.5} color="#ffeac1" />
  </group>;
}
