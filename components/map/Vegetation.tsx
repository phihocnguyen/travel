"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import {
  CanvasTexture, Color, DoubleSide, InstancedMesh, LinearMipmapLinearFilter,
  MathUtils, Object3D, Quaternion, SRGBColorSpace, Vector3,
} from "three";
import type { MapAssets } from "@/lib/map/assets";
import { ATTRACTIONS } from "@/lib/map/attractions";
import { elevationToScene } from "./Terrain";
import { useMapUI, type MapSeason } from "./MapUIContext";

type Tree = { x: number; y: number; z: number; size: number; tint: number; angle: number; fruit: boolean };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (1664525 * s + 1013904223) >>> 0) / 4294967296);
}
function noise(x: number, z: number) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
function smoothNoise(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = MathUtils.lerp(noise(ix, iz), noise(ix + 1, iz), sx);
  const b = MathUtils.lerp(noise(ix, iz + 1), noise(ix + 1, iz + 1), sx);
  return MathUtils.lerp(a, b, sz);
}

// Each crown is a textured, softly shaded leafy cluster rather than a low-poly ball.
// No external asset URLs or network dependencies: texture is generated once on the client.
function createCanopyTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const random = rng(134912);
  const cx = size / 2, cy = size / 2;
  for (let i = 0; i < 1750; i++) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 108;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const edge = Math.max(0, Math.min(1, (112 - radius) / 27));
    const r = 2 + random() * 8;
    const bright = (1 - y / size) * 28 + random() * 55;
    ctx.fillStyle = `rgba(${Math.round(35 + bright * .46)},${Math.round(70 + bright)},${Math.round(27 + bright * .4)},${(.2 + random() * .65) * edge})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r * (0.7 + random()), r * (0.65 + random()), angle, 0, Math.PI * 2);
    ctx.fill();
  }
  // Canopy highlights and deep crevices create useful texture at aerial zoom levels.
  for (let i = 0; i < 600; i++) {
    const a = random() * Math.PI * 2, rad = Math.sqrt(random()) * 98;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    ctx.fillStyle = random() > .48 ? "rgba(16,37,15,.2)" : "rgba(202,214,112,.15)";
    ctx.beginPath(); ctx.arc(x, y, 1 + random() * 4.5, 0, Math.PI * 2); ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = 8;
  return texture;
}

function readPixels(texture: { image: unknown }) {
  try {
    const image = texture.image as CanvasImageSource & { width: number; height: number };
    if (!image?.width || !image?.height) return null;
    const cvs = document.createElement("canvas");
    const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
    cvs.width = Math.max(1, Math.round(image.width * scale));
    cvs.height = Math.max(1, Math.round(image.height * scale));
    const ctx = cvs.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0);
    return { data: ctx.getImageData(0, 0, cvs.width, cvs.height).data, width: cvs.width, height: cvs.height };
  } catch { return null; }
}

function generateForest(assets: MapAssets, compact: boolean): Tree[] {
  const random = rng(20261031);
  const { projector } = assets;
  const width = projector.widthKm, depth = projector.depthKm;
  const mask = readPixels(assets.mask);
  const image = readPixels(assets.imagery);
  const places = ATTRACTIONS.map(a => projector.toLocal(a.lon, a.lat));
  const target = compact ? 5000 : 27000;
  const trees: Tree[] = [];
  const spacing = Math.sqrt((width * depth) / target);
  const cols = Math.ceil(width / spacing);
  const rows = Math.ceil(depth / spacing);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = ((col + .2 + random() * .6) / cols - .5) * width;
      const z = ((row + .2 + random() * .6) / rows - .5) * depth;
      const u = x / width + .5, v = .5 - z / depth;
      if (u <= .018 || u >= .982 || v <= .018 || v >= .982) continue;
      if (mask) {
        const px = Math.min(mask.width - 1, Math.floor(u * mask.width));
        const py = Math.min(mask.height - 1, Math.floor((1 - v) * mask.height));
        if (mask.data[(py * mask.width + px) * 4 + 1] < 130) continue;
      }
      // Broad coherent patches avoid the evenly scattered "park tree" appearance.
      const density = smoothNoise(u * 13, v * 13) * .50 + smoothNoise(u * 37, v * 37) * .28 + smoothNoise(u * 5, v * 5) * .22;
      if (density < .29 || random() > MathUtils.smoothstep(density, .24, .66)) continue;
      if (places.some(([px, pz]) => (px - x) ** 2 + (pz - z) ** 2 < spacing * spacing * 18)) continue;
      // Keep bright non-vegetated / water pixels visible when imagery is readable.
      if (image) {
        const ix = Math.min(image.width - 1, Math.floor(u * image.width));
        const iy = Math.min(image.height - 1, Math.floor((1 - v) * image.height));
        const p = (iy * image.width + ix) * 4;
        const r = image.data[p], g = image.data[p + 1], b = image.data[p + 2];
        const vegetation = (g - r * .64 - b * .26);
        if ((b > g * 1.13 && b > r * 1.13) || (r + g + b > 565 && vegetation < 25)) continue;
      }
      const y = elevationToScene(assets.dem.sample(u, v));
      if (!Number.isFinite(y)) continue;
      trees.push({ x, y, z, size: spacing * (.76 + random() * .92), tint: random(), angle: random() * Math.PI * 2, fruit: random() > .76 });
    }
  }
  return trees;
}

function ForestInstances({ trees, season }: { trees: Tree[]; season: MapSeason }) {
  const bodyRef = useRef<InstancedMesh>(null);
  const crownRef = useRef<InstancedMesh>(null);
  const fruitRef = useRef<InstancedMesh>(null);
  const texture = useMemo(createCanopyTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const count = trees.length;
  const fruitTrees = useMemo(() => trees.filter(t => t.fruit), [trees]);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const color = new Color();
    const flat = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
    for (let i = 0; i < count; i++) {
      const t = trees[i];
      const height = t.size * (0.66 + t.tint * .38);
      dummy.rotation.set(0, t.angle, 0);
      dummy.position.set(t.x, t.y + height * .53, t.z);
      dummy.scale.set(t.size * .46, height * .65, t.size * .46);
      dummy.updateMatrix();
      bodyRef.current?.setMatrixAt(i, dummy.matrix);
      color.set(season === "dry" ? "#496b2d" : season === "flood" ? "#315b43" : "#3d6130");
      color.multiplyScalar(.68 + t.tint * .72);
      bodyRef.current?.setColorAt(i, color);

      dummy.position.set(t.x, t.y + height, t.z);
      dummy.quaternion.copy(flat);
      dummy.rotateZ(t.angle);
      dummy.scale.set(t.size * 1.15, t.size * 1.15, 1);
      dummy.updateMatrix();
      crownRef.current?.setMatrixAt(i, dummy.matrix);
      color.set(season === "dry" ? "#b7b873" : season === "flood" ? "#9cbaa3" : "#b2c07b");
      color.multiplyScalar(.66 + t.tint * .52);
      crownRef.current?.setColorAt(i, color);
      dummy.quaternion.identity();
    }
    for (let i = 0; i < fruitTrees.length; i++) {
      const t = fruitTrees[i];
      dummy.position.set(t.x + t.size * .15, t.y + t.size * .90, t.z - t.size * .12);
      dummy.scale.setScalar(t.size * (season === "flood" ? .001 : .16));
      dummy.updateMatrix();
      fruitRef.current?.setMatrixAt(i, dummy.matrix);
      fruitRef.current?.setColorAt(i, color.set(season === "dry" ? "#ffab3c" : "#efc45d"));
    }
    for (const mesh of [bodyRef.current, crownRef.current, fruitRef.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [count, trees, fruitTrees, season]);

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, count]} frustumCulled={false} raycast={() => null}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={1} flatShading />
      </instancedMesh>
      <instancedMesh ref={crownRef} args={[undefined, undefined, count]} frustumCulled={false} raycast={() => null}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.12} depthWrite side={DoubleSide} polygonOffset polygonOffsetFactor={-1} />
      </instancedMesh>
      <instancedMesh ref={fruitRef} args={[undefined, undefined, fruitTrees.length]} frustumCulled={false} raycast={() => null}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={.85} />
      </instancedMesh>
    </group>
  );
}

export function Vegetation({ assets }: { assets: MapAssets }) {
  const { season } = useMapUI();
  const gl = useThree(state => state.gl);
  const compact = useMemo(() => {
    const context = gl.getContext();
    const info = context.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(context.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : context.RENDERER));
    return /swiftshader|llvmpipe|software|warp/i.test(renderer);
  }, [gl]);
  const trees = useMemo(() => generateForest(assets, compact), [assets, compact]);
  return <ForestInstances trees={trees} season={season} />;
}
