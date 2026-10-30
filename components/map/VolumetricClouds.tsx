"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Data3DTexture,
  GLSL3,
  LinearFilter,
  RGBAFormat,
  RepeatWrapping,
  ShaderMaterial,
  UnsignedByteType,
  Vector3,
  type Mesh,
} from "three";

type Props = {
  base: number;
  width: number;
  depth: number;
};

/**
 * A tileable 3D noise volume used by the raymarcher.
 *
 * R: low-frequency shape noise
 * G: high-frequency erosion noise
 * B: cellular billow noise (worley) for cauliflower-like edges
 *
 * Generating this on the CPU once is far cheaper than evaluating several
 * octaves of value noise per raymarch step on the GPU.
 */
function makeCloudNoise(size: number) {
  const data = new Uint8Array(size * size * size * 4);
  const fade = (t: number) => t * t * (3 - 2 * t);
  const wrap = (v: number, p: number) => ((v % p) + p) % p;

  const hash3 = (x: number, y: number, z: number, seed: number) => {
    let h =
      Math.imul(x, 0x27d4eb2d) ^
      Math.imul(y, 0x165667b1) ^
      Math.imul(z, 0x9e3779b1) ^
      Math.imul(seed, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h ^= h >>> 12;
    h = Math.imul(h, 0x297a2d39);
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  };

  function valueNoise(x: number, y: number, z: number, period: number, seed: number) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const fx = fade(x - xi);
    const fy = fade(y - yi);
    const fz = fade(z - zi);
    const hash = (i: number, j: number, k: number) =>
      hash3(wrap(xi + i, period), wrap(yi + j, period), wrap(zi + k, period), seed);

    const x00 = hash(0, 0, 0) + (hash(1, 0, 0) - hash(0, 0, 0)) * fx;
    const x10 = hash(0, 1, 0) + (hash(1, 1, 0) - hash(0, 1, 0)) * fx;
    const x01 = hash(0, 0, 1) + (hash(1, 0, 1) - hash(0, 0, 1)) * fx;
    const x11 = hash(0, 1, 1) + (hash(1, 1, 1) - hash(0, 1, 1)) * fx;
    const y0 = x00 + (x10 - x00) * fy;
    const y1 = x01 + (x11 - x01) * fy;
    return y0 + (y1 - y0) * fz;
  }

  function fbm(
    x: number,
    y: number,
    z: number,
    basePeriod: number,
    octaves: number,
    seed: number,
  ) {
    let value = 0;
    let amplitude = 0.5;
    let total = 0;
    let period = basePeriod;
    for (let i = 0; i < octaves; i++) {
      value += valueNoise(x * period, y * period, z * period, period, seed + i * 17) * amplitude;
      total += amplitude;
      amplitude *= 0.52;
      period *= 2;
    }
    return value / total;
  }

  function worley(x: number, y: number, z: number, period: number, seed: number) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    let nearest = 9;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const gx = xi + dx;
          const gy = yi + dy;
          const gz = zi + dz;
          const wx = wrap(gx, period);
          const wy = wrap(gy, period);
          const wz = wrap(gz, period);
          const fx = gx + hash3(wx, wy, wz, seed);
          const fy = gy + hash3(wx, wy, wz, seed + 31);
          const fz = gz + hash3(wx, wy, wz, seed + 67);
          const distance = (fx - x) ** 2 + (fy - y) ** 2 + (fz - z) ** 2;
          if (distance < nearest) nearest = distance;
        }
      }
    }
    return Math.min(1, Math.sqrt(nearest));
  }

  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        const w = z / size;
        const shape = fbm(u, v, w, 4, 3, 7);
        const detail = fbm(u, v, w, 10, 3, 41);
        const billow = 1 - worley(u * 6, v * 6, w * 6, 6, 13) * 1.7;
        const index = ((z * size + y) * size + x) * 4;
        data[index] = Math.round(Math.max(0, Math.min(1, shape)) * 255);
        data[index + 1] = Math.round(Math.max(0, Math.min(1, detail)) * 255);
        data[index + 2] = Math.round(Math.max(0, Math.min(1, billow)) * 255);
        data[index + 3] = 255;
      }
    }
  }

  const texture = new Data3DTexture(data, size, size, size);
  texture.format = RGBAFormat;
  texture.type = UnsignedByteType;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.wrapR = RepeatWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}

const CLOUD_VERTEX = /* glsl */ `
  out vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const CLOUD_FRAGMENT = /* glsl */ `
  precision highp float;
  precision highp sampler3D;

  in vec3 vWorld;
  out vec4 fragColor;

  uniform sampler3D uNoise;
  uniform vec3 uMin;
  uniform vec3 uMax;
  uniform vec3 uSun;
  uniform vec3 uShadowTint;
  uniform vec3 uSunTint;
  uniform float uTime;
  uniform float uCoverage;
  uniform float uDensity;
  uniform float uSigma;
  uniform float uOpacity;
  uniform int uSteps;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float cloudDensity(vec3 p) {
    vec3 size = uMax - uMin;
    vec3 uvw = (p - uMin) / size;
    float height =
      smoothstep(0.02, 0.18, uvw.y) *
      smoothstep(0.0, 0.34, 1.0 - uvw.y);

    // Two overlapping noise fields: broad masses plus cellular billows. The
    // slower second field drifts at a different rate so the edges churn.
    vec3 wind = vec3(uTime * 0.0062, 0.0, uTime * 0.0040);
    vec3 q = uvw * vec3(1.55, 1.9, 1.55) + wind;

    float shape = texture(uNoise, q).r;
    float billow = texture(uNoise, q * 1.4 - wind * 1.5).b;

    float base = shape * 0.7 + billow * 0.5;
    float body = smoothstep(uCoverage, uCoverage + 0.16, base);
    float erosion = mix(0.58, 1.0, smoothstep(0.12, 0.9, shape));

    return body * erosion * height * uDensity;
  }

  float lightTransmittance(vec3 p) {
    // One shadow tap toward the sun gives soft self-shadowing without the
    // cost of a full light march.
    return exp(-cloudDensity(p + uSun * 2.1) * 1.5);
  }

  void main() {
    vec3 rayOrigin = cameraPosition;
    vec3 rayDir = normalize(vWorld - rayOrigin);
    vec3 invDir = 1.0 / rayDir;

    vec3 t0 = (uMin - rayOrigin) * invDir;
    vec3 t1 = (uMax - rayOrigin) * invDir;
    vec3 tSmall = min(t0, t1);
    vec3 tBig = max(t0, t1);
    float tNear = max(max(tSmall.x, tSmall.y), tSmall.z);
    float tFar = min(min(tBig.x, tBig.y), tBig.z);
    tNear = max(tNear, 0.0);
    if (tFar <= tNear) discard;

    float stepSize = (tFar - tNear) / float(uSteps);
    // A constant offset avoids the per-pixel speckle a random dither would
    // create without temporal accumulation.
    float t = tNear + 0.5 * stepSize;

    vec3 scattered = vec3(0.0);
    float transmittance = 1.0;
    float phase = 0.68 + 0.32 * pow(max(dot(rayDir, uSun), 0.0), 2.5);

    for (int i = 0; i < 32; i++) {
      if (i >= uSteps || t > tFar || transmittance < 0.012) break;
      vec3 p = rayOrigin + rayDir * t;
      float density = cloudDensity(p);
      if (density > 0.002) {
        float light = lightTransmittance(p);
        float height = clamp((p.y - uMin.y) / max(uMax.y - uMin.y, 0.001), 0.0, 1.0);
        vec3 shadowColor = uShadowTint * (0.9 + height * 0.16);
        vec3 litColor = mix(shadowColor, uSunTint, clamp(light, 0.0, 1.0));
        float extinction = exp(-density * stepSize * uSigma);
        scattered += transmittance * (1.0 - extinction) * litColor * phase;
        transmittance *= extinction;
      }
      t += stepSize;
    }

    float alpha = (1.0 - transmittance) * uOpacity;
    if (alpha < 0.004) discard;
    vec3 color = scattered / max(1.0 - transmittance, 0.0001);
    // ShaderMaterial output is treated as linear; convert to the renderer's
    // sRGB output so clouds keep their soft, bright highlights.
    color = pow(max(color, 0.0), vec3(0.4545));
    fragColor = vec4(color, alpha);
  }
`;

function lowPowerDevice() {
  if (typeof navigator === "undefined") return true;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent);
  const lowMemory = (nav.deviceMemory ?? 8) < 6;
  const lowCores = (nav.hardwareConcurrency ?? 8) < 6;
  return mobile || lowMemory || lowCores;
}

export function VolumetricClouds({ base, width, depth }: Props) {
  const mesh = useRef<Mesh>(null);
  const lowPower = useMemo(lowPowerDevice, []);
  const noise = useMemo(() => makeCloudNoise(lowPower ? 40 : 48), [lowPower]);
  useEffect(() => () => noise.dispose(), [noise]);

  const bounds = useMemo(() => {
    const halfWidth = width * 1.05;
    const halfDepth = depth * 1.05;
    const bottom = base + 7;
    const top = base + 26;
    return {
      size: [halfWidth * 2, top - bottom, halfDepth * 2] as [number, number, number],
      center: [0, (top + bottom) / 2, 0] as [number, number, number],
      min: new Vector3(-halfWidth, bottom, -halfDepth),
      max: new Vector3(halfWidth, top, halfDepth),
    };
  }, [base, width, depth]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        glslVersion: GLSL3,
        uniforms: {
          uNoise: { value: noise },
          uMin: { value: bounds.min },
          uMax: { value: bounds.max },
          uSun: { value: new Vector3(-0.46, 0.76, 0.46).normalize() },
          uShadowTint: { value: new Vector3(0.58, 0.65, 0.67) },
          uSunTint: { value: new Vector3(0.98, 0.96, 0.89) },
          uTime: { value: 0 },
          uCoverage: { value: 0.56 },
          uDensity: { value: 1.8 },
          uSigma: { value: 0.5 },
          uOpacity: { value: lowPower ? 0.42 : 0.54 },
          uSteps: { value: lowPower ? 12 : 22 },
        },
        vertexShader: CLOUD_VERTEX,
        fragmentShader: CLOUD_FRAGMENT,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [noise, bounds, lowPower],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh
      ref={mesh}
      position={bounds.center}
      raycast={() => null}
      renderOrder={2}
    >
      <boxGeometry args={bounds.size} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
