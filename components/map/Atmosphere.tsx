"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  LinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  ShaderMaterial,
} from "three";
import type { MapAssets } from "@/lib/map/assets";

const CLOUD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CLOUD_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uScale;
  uniform vec2 uDrift;
  uniform vec3 uTint;
  uniform float uDetail;
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vec2 baseUv = vUv * uScale;
    vec2 warp = vec2(
      texture2D(uMap, baseUv * 0.34 + vec2(uTime * 0.003, -uTime * 0.0013)).a,
      texture2D(uMap, baseUv * 0.34 + vec2(-uTime * 0.0017, uTime * 0.0025)).a
    ) - 0.5;

    vec2 uvA = baseUv + warp * 0.38 + uDrift * uTime;
    vec2 uvB = baseUv * 1.57 - warp * 0.22 + vec2(0.016, -0.011) * uTime;
    vec2 uvC = baseUv * 0.72 + warp * 0.18 + vec2(-0.007, 0.005) * uTime;

    float a = texture2D(uMap, uvA).a;
    float b = texture2D(uMap, uvB).a;
    float c = texture2D(uMap, uvC).a;

    float density = a * 0.56 + b * 0.29 + c * 0.31;
    float cloud = smoothstep(0.34, 0.92, density);
    float detail = smoothstep(0.58, 0.96, density) * uDetail;

    vec2 edgeUv = smoothstep(vec2(0.0), vec2(0.2), vUv) *
      smoothstep(vec2(0.0), vec2(0.2), 1.0 - vUv);
    float edge = edgeUv.x * edgeUv.y;

    float verticalFade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(0.0, 0.2, 1.0 - vUv.y);
    float alpha = cloud * edge * verticalFade * uOpacity;
    if (alpha < 0.003) discard;

    float softShadow = smoothstep(0.28, 0.78, density) * 0.12;
    vec3 color = uTint + vec3(detail * 0.18 - softShadow * 0.06);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

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

type CloudLayerProps = {
  map: CanvasTexture;
  y: number;
  scale: number;
  opacity: number;
  drift: [number, number];
  size: [number, number];
  tint: string;
  detail?: number;
};

function CloudLayer({
  map,
  y,
  scale,
  opacity,
  drift,
  size,
  tint,
  detail = 1,
}: CloudLayerProps) {
  const tintColor = useMemo(() => new Color(tint), [tint]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uMap: { value: map },
          uTime: { value: 0 },
          uOpacity: { value: opacity },
          uScale: { value: scale },
          uDrift: { value: drift },
          uTint: { value: tintColor.clone() },
          uDetail: { value: detail },
        },
        vertexShader: CLOUD_VERTEX,
        fragmentShader: CLOUD_FRAGMENT,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [map, scale, opacity, drift, tintColor, detail],
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

  const hazeBanks = useMemo(
    () => [
      { x: -width * 0.28, z: -depth * 0.18, y: base + 10, sx: width * 0.44, sz: depth * 0.28, r: 0.28, o: 0.12 },
      { x: width * 0.32, z: -depth * 0.24, y: base + 13, sx: width * 0.38, sz: depth * 0.26, r: -0.18, o: 0.1 },
      { x: width * 0.24, z: depth * 0.31, y: base + 12, sx: width * 0.34, sz: depth * 0.22, r: 0.36, o: 0.11 },
      { x: -width * 0.36, z: depth * 0.24, y: base + 11, sx: width * 0.3, sz: depth * 0.2, r: -0.22, o: 0.09 },
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
      <CloudLayer
        map={cloudMap}
        y={base + 13}
        scale={2.3}
        opacity={0.11}
        drift={[0.0011, 0.0008]}
        size={[width * 1.15, depth * 1.15]}
        tint="#dde4dd"
        detail={0.9}
      />
      <CloudLayer
        map={cloudMap}
        y={base + 20}
        scale={2.9}
        opacity={0.18}
        drift={[0.0018, 0.0012]}
        size={[width * 1.52, depth * 1.52]}
        tint="#edf1ec"
        detail={1.0}
      />
      <CloudLayer
        map={cloudMap}
        y={base + 31}
        scale={3.8}
        opacity={0.16}
        drift={[-0.0012, 0.0015]}
        size={[width * 1.9, depth * 1.9]}
        tint="#f6f7f4"
        detail={1.15}
      />

      {hazeBanks.map((bank, index) => (
        <mesh
          key={index}
          rotation={[-Math.PI / 2, 0, bank.r]}
          position={[bank.x, bank.y, bank.z]}
          raycast={() => null}
          matrixAutoUpdate={false}
        >
          <planeGeometry args={[bank.sx, bank.sz]} />
          <meshBasicMaterial
            map={cloudMap}
            transparent
            opacity={bank.o}
            depthWrite={false}
            toneMapped={false}
            color="#d7ddd7"
          />
        </mesh>
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
