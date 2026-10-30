"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import type { MapAssets } from "@/lib/map/assets";
import { VolumetricClouds } from "./VolumetricClouds";

function makeCloudTexture(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);

  const octaves = [4, 8, 16, 32, 64, 96];
  const grids = octaves.map((count) => {
    const values = new Float32Array(count * count);
    let seed = count * 1231 + 9817;
    for (let i = 0; i < values.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      values[i] = (seed % 100000) / 100000;
    }
    return { count, values };
  });

  const sample = (
    values: Float32Array,
    count: number,
    x: number,
    y: number,
  ) => {
    const fx = x * count;
    const fy = y * count;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const wrap = (v: number) => ((v % count) + count) % count;
    const a = values[wrap(y0) * count + wrap(x0)];
    const b = values[wrap(y0) * count + wrap(x0 + 1)];
    const c = values[wrap(y0 + 1) * count + wrap(x0)];
    const d = values[wrap(y0 + 1) * count + wrap(x0 + 1)];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const dx = u - 0.5;
      const dy = v - 0.5;
      const radial = Math.hypot(dx, dy);
      let value = 0;
      let amplitude = 0.55;
      let total = 0;
      for (const { count, values } of grids) {
        value += sample(values, count, u, v) * amplitude;
        total += amplitude;
        amplitude *= 0.54;
      }
      value /= total;
      const puff = Math.max(0, 1 - radial * 1.72);
      const erosion = Math.max(0, (value - 0.42) / 0.5);
      const alpha = Math.pow(Math.min(1, erosion * 1.08 + puff * 0.24), 1.6);
      const p = (y * size + x) * 4;
      image.data[p] = 255;
      image.data[p + 1] = 255;
      image.data[p + 2] = 255;
      image.data[p + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(image, 0, 0);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function makeDotTexture() {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255,248,224,1)");
  gradient.addColorStop(0.35, "rgba(255,242,206,0.55)");
  gradient.addColorStop(1, "rgba(255,240,200,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

type MistBankProps = {
  map: CanvasTexture;
  x: number;
  z: number;
  y: number;
  size: [number, number];
  rotation: number;
  opacity: number;
  speed: number;
  phase: number;
  tint: string;
  driftX: number;
  driftZ: number;
};

function MistBank({
  map,
  x,
  z,
  y,
  size,
  rotation: baseRotation,
  opacity,
  speed,
  phase,
  tint,
  driftX,
  driftZ,
}: MistBankProps) {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map,
        color: new Color(tint),
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    [map, tint, opacity],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const current = mesh.current;
    if (!current) return;
    const t = state.clock.elapsedTime;
    current.position.x = x + Math.sin(t * speed + phase) * driftX;
    current.position.z = z + Math.cos(t * speed * 0.83 + phase) * driftZ;
    current.rotation.z = baseRotation + Math.sin(t * speed * 0.5 + phase) * 0.055;
    material.opacity = opacity * (0.7 + 0.3 * Math.sin(t * 0.22 + phase * 1.7));
  });

  return (
    <mesh
      ref={mesh}
      rotation={[-Math.PI / 2, 0, baseRotation]}
      position={[x, y, z]}
      raycast={() => null}
    >
      <planeGeometry args={size} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

type Props = {
  assets: MapAssets;
  base: number;
};

export function Atmosphere({ assets, base }: Props) {
  const width = assets.projector.widthKm;
  const depth = assets.projector.depthKm;
  const gl = useThree((state) => state.gl);

  const supportsMist = useMemo(() => {
    try {
      const context = gl.getContext();
      const info = context.getExtension("WEBGL_debug_renderer_info");
      const name = String(
        info
          ? context.getParameter(info.UNMASKED_RENDERER_WEBGL)
          : context.getParameter(context.RENDERER),
      );
      return !/swiftshader|llvmpipe|software|warp/i.test(name);
    } catch {
      return true;
    }
  }, [gl]);

  const cloudMap = useMemo(() => makeCloudTexture(), []);
  useEffect(() => () => cloudMap.dispose(), [cloudMap]);

  const dotTexture = useMemo(() => makeDotTexture(), []);
  useEffect(() => () => dotTexture.dispose(), [dotTexture]);

  // Low, slow-moving fog banks sit just above the fields and canals. They use
  // the same cloud noise texture as the high layers, so no extra asset cost.
  const mistBanks = useMemo(
    () => [
      { x: -width * 0.3, z: -depth * 0.05, y: base + 2.6, sx: width * 0.62, sz: depth * 0.22, r: 0.16, o: 0.16, speed: 0.075, phase: 0.4, driftX: width * 0.035, driftZ: depth * 0.012 },
      { x: width * 0.24, z: -depth * 0.26, y: base + 3.4, sx: width * 0.56, sz: depth * 0.2, r: -0.24, o: 0.14, speed: 0.062, phase: 1.9, driftX: width * 0.028, driftZ: depth * 0.014 },
      { x: width * 0.34, z: depth * 0.22, y: base + 3.1, sx: width * 0.5, sz: depth * 0.24, r: 0.3, o: 0.15, speed: 0.084, phase: 3.1, driftX: width * 0.032, driftZ: depth * 0.01 },
      { x: -width * 0.32, z: depth * 0.32, y: base + 4.1, sx: width * 0.48, sz: depth * 0.18, r: -0.12, o: 0.12, speed: 0.055, phase: 4.6, driftX: width * 0.026, driftZ: depth * 0.016 },
      { x: 0, z: -depth * 0.4, y: base + 5.2, sx: width * 0.7, sz: depth * 0.16, r: 0.08, o: 0.11, speed: 0.048, phase: 5.8, driftX: width * 0.04, driftZ: depth * 0.009 },
      { x: width * 0.05, z: depth * 0.42, y: base + 5.6, sx: width * 0.64, sz: depth * 0.15, r: -0.06, o: 0.1, speed: 0.052, phase: 2.5, driftX: width * 0.034, driftZ: depth * 0.011 },
    ],
    [width, depth, base],
  );


  const motes = useMemo(() => {
    const count = 72;
    const seeds = new Float32Array(count * 4);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * width * 0.88;
      const z = (Math.random() - 0.5) * depth * 0.88;
      const phase = Math.random() * Math.PI * 2;
      const speed = 0.18 + Math.random() * 0.32;
      seeds[i * 4] = x;
      seeds[i * 4 + 1] = z;
      seeds[i * 4 + 2] = phase;
      seeds[i * 4 + 3] = speed;
      positions[i * 3] = x;
      positions[i * 3 + 1] = base + 8 + Math.random() * 20;
      positions[i * 3 + 2] = z;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    return { geometry, seeds, count };
  }, [width, depth, base]);

  useEffect(() => () => motes.geometry.dispose(), [motes]);

  const moteRef = useRef<BufferAttribute>(null);
  useFrame((state) => {
    const attribute = moteRef.current;
    if (!attribute) return;
    const t = state.clock.elapsedTime;
    const array = attribute.array as Float32Array;
    for (let i = 0; i < motes.count; i++) {
      const x = motes.seeds[i * 4];
      const z = motes.seeds[i * 4 + 1];
      const phase = motes.seeds[i * 4 + 2];
      const speed = motes.seeds[i * 4 + 3];
      array[i * 3] = x + Math.sin(t * 0.12 + phase) * 2.2;
      array[i * 3 + 1] = base + 6 + ((t * speed + phase * 3.1) % 18);
      array[i * 3 + 2] = z + Math.cos(t * 0.09 + phase) * 2.2;
    }
    attribute.needsUpdate = true;
  });

  return (
    <group>
      <VolumetricClouds base={base} width={width} depth={depth} />

      {supportsMist && mistBanks.map((bank, index) => (
        <MistBank
          key={`mist-${index}`}
          map={cloudMap}
          x={bank.x}
          z={bank.z}
          y={bank.y}
          size={[bank.sx, bank.sz]}
          rotation={bank.r}
          opacity={bank.o}
          speed={bank.speed}
          phase={bank.phase}
          tint="#cbd8cb"
          driftX={bank.driftX}
          driftZ={bank.driftZ}
        />
      ))}

      <points geometry={motes.geometry} frustumCulled={false}>
        <bufferAttribute
          ref={moteRef}
          attach="attributes-position"
          args={[motes.geometry.attributes.position.array as Float32Array, 3]}
        />
        <pointsMaterial
          map={dotTexture}
          size={0.72}
          sizeAttenuation
          transparent
          opacity={0.24}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
