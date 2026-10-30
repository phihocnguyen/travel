"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  LinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  ShaderMaterial,
} from "three";
import type { MapAssets } from "@/lib/map/assets";

const CLOUD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CLOUD_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uScale;
  uniform vec2 uDrift;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv * uScale + uDrift * uTime;
    float a = texture2D(uMap, uv).a;
    float b = texture2D(uMap, uv * 1.7 + vec2(0.013, -0.009) * uTime).a;
    float cloud = smoothstep(0.24, 0.9, a * 0.68 + b * 0.42);

    // Fade the plane edges so the rectangular geometry never shows up.
    vec2 edgeUv = smoothstep(vec2(0.0), vec2(0.16), vUv) *
      smoothstep(vec2(0.0), vec2(0.16), 1.0 - vUv);
    float edge = edgeUv.x * edgeUv.y;

    float alpha = cloud * edge * uOpacity;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(vec3(0.86, 0.91, 0.88), alpha);
    #include <colorspace_fragment>
  }
`;

/**
 * Periodic value-noise fbm baked once into a tileable alpha texture. Cheaper
 * than evaluating five octaves per pixel every frame, and the repeat wrapping
 * lets the cloud planes scroll forever without a visible seam.
 */
function makeCloudTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);

  const octaves = [4, 8, 16, 32, 64];
  const grids = octaves.map((count) => {
    const values = new Float32Array(count * count);
    // Deterministic pseudo-random lattice; no Math.random so hot reloads keep
    // the same cloud silhouette.
    let seed = count * 9301 + 49297;
    for (let i = 0; i < values.length; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      values[i] = seed / 233280;
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
      let value = 0;
      let amplitude = 0.55;
      let total = 0;
      grids.forEach(({ count, values }) => {
        value += sample(values, count, u, v) * amplitude;
        total += amplitude;
        amplitude *= 0.5;
      });
      value /= total;
      const alpha = Math.max(0, Math.min(1, (value - 0.36) / 0.44));
      const p = (y * size + x) * 4;
      image.data[p] = 255;
      image.data[p + 1] = 255;
      image.data[p + 2] = 255;
      image.data[p + 3] = Math.round(alpha * alpha * 255);
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
  gradient.addColorStop(0.4, "rgba(255,240,200,0.5)");
  gradient.addColorStop(1, "rgba(255,240,200,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

type CloudLayerProps = {
  map: CanvasTexture;
  y: number;
  scale: number;
  opacity: number;
  drift: [number, number];
  size: [number, number];
};

function CloudLayer({ map, y, scale, opacity, drift, size }: CloudLayerProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uMap: { value: map },
          uTime: { value: 0 },
          uOpacity: { value: opacity },
          uScale: { value: scale },
          uDrift: { value: drift },
        },
        vertexShader: CLOUD_VERTEX,
        fragmentShader: CLOUD_FRAGMENT,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [map, scale, opacity, drift],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, y, 0]}
      raycast={() => null}
      matrixAutoUpdate={false}
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

  const cloudMap = useMemo(() => makeCloudTexture(), []);
  useEffect(() => () => cloudMap.dispose(), [cloudMap]);

  const dotTexture = useMemo(() => makeDotTexture(), []);
  useEffect(() => () => dotTexture.dispose(), [dotTexture]);

  const motes = useMemo(() => {
    const count = 90;
    const seeds = new Float32Array(count * 4);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * width * 0.92;
      const z = (Math.random() - 0.5) * depth * 0.92;
      const phase = Math.random() * Math.PI * 2;
      const speed = 0.25 + Math.random() * 0.5;
      seeds[i * 4] = x;
      seeds[i * 4 + 1] = z;
      seeds[i * 4 + 2] = phase;
      seeds[i * 4 + 3] = speed;
      positions[i * 3] = x;
      positions[i * 3 + 1] = base + 3 + Math.random() * 18;
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
      array[i * 3] = x + Math.sin(t * 0.16 + phase) * 3.2;
      array[i * 3 + 1] = base + 2 + ((t * speed + phase * 4) % 16);
      array[i * 3 + 2] = z + Math.cos(t * 0.12 + phase) * 3.2;
    }
    attribute.needsUpdate = true;
  });

  return (
    <group>
      <CloudLayer
        map={cloudMap}
        y={base + 17}
        scale={2.1}
        opacity={0.3}
        drift={[0.0024, 0.0011]}
        size={[width * 1.5, depth * 1.5]}
      />
      <CloudLayer
        map={cloudMap}
        y={base + 30}
        scale={3.4}
        opacity={0.18}
        drift={[-0.0015, 0.0019]}
        size={[width * 1.9, depth * 1.9]}
      />

      <points geometry={motes.geometry} frustumCulled={false}>
        <bufferAttribute
          ref={moteRef}
          attach="attributes-position"
          args={[motes.geometry.attributes.position.array as Float32Array, 3]}
        />
        <pointsMaterial
          map={dotTexture}
          size={0.9}
          sizeAttenuation
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
