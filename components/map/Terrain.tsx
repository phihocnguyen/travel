"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  LineBasicMaterial,
  MeshBasicMaterial,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector2,
} from "three";
import { idAt } from "@/lib/geo/adminTextures";
import { forEachRing, geometryContains } from "@/lib/geo/polygon";
import { applyTextureQuality, type MapAssets } from "@/lib/map/assets";
import { useMapUI } from "./MapUIContext";

export const EXAGGERATION = 18;

export function elevationToScene(meters: number) {
  return (meters * EXAGGERATION) / 1000;
}

type TerrainProps = {
  assets: MapAssets;
  segments?: number;
  onHoverId?: (id: number | null) => void;
};

const TERRAIN_VERTEX = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vHeight;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    vHeight = position.y;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const TERRAIN_FRAGMENT = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  uniform sampler2D uImagery;
  uniform sampler2D uMask;
  uniform sampler2D uAdmin;
  uniform sampler2D uAdminId;
  uniform vec2 uImageryOffset;
  uniform vec2 uImageryRepeat;
  uniform vec2 uImageryTexel;
  uniform float uAdminOpacity;
  uniform float uHoverId;
  uniform float uHoverFade;
  uniform float uTime;
  uniform float uSeasonFrom;
  uniform float uSeasonTo;
  uniform vec2 uWaveOrigin;
  uniform float uWaveRadius;
  uniform float uWaveFeather;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vHeight;

  float communeId(vec2 uv) {
    return floor(texture2D(uAdminId, uv).r * 255.0 + 0.5);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      value += noise(p) * amp;
      p *= 2.03;
      amp *= 0.5;
    }
    return value;
  }

  vec3 sampleImagery(vec2 uv) {
    return texture2D(uImagery, uv).rgb;
  }

  void main() {
    vec4 mask = texture2D(uMask, vUv);
    if (mask.g < 0.45) discard;

    vec2 imageryUv = vUv * uImageryRepeat + uImageryOffset;
    vec2 texel = max(uImageryTexel, vec2(0.0002));

    vec3 color = sampleImagery(imageryUv);
    vec3 north = sampleImagery(imageryUv + vec2(0.0, texel.y));
    vec3 south = sampleImagery(imageryUv - vec2(0.0, texel.y));
    vec3 east = sampleImagery(imageryUv + vec2(texel.x, 0.0));
    vec3 west = sampleImagery(imageryUv - vec2(texel.x, 0.0));
    vec3 blur = (north + south + east + west) * 0.25;
    vec3 detail = color - blur;
    color += detail * 0.55;

    vec3 n = normalize(vNormal);
    float slope = 1.0 - clamp(n.y, 0.0, 1.0);
    float sunKey = clamp(dot(n, normalize(vec3(-0.48, 0.84, 0.24))), 0.0, 1.0);
    float sunFill = clamp(dot(n, normalize(vec3(0.35, 0.58, -0.74))), 0.0, 1.0);
    float rim = pow(1.0 - clamp(dot(n, normalize(vec3(0.0, 0.96, 0.18))), 0.0, 1.0), 3.0);
    float shadow = mix(1.0, 0.8, slope * 0.72);

    color *= shadow;
    color *= mix(0.92, 1.16, sunKey);
    color += vec3(0.03, 0.045, 0.035) * sunFill * 0.18;
    color += vec3(0.07, 0.08, 0.06) * rim * 0.08;

    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, 1.16);
    color = clamp((color - 0.5) * 1.08 + 0.5, 0.0, 1.0);

    float elevTint = smoothstep(0.6, 5.5, vHeight);
    color = mix(color, color * vec3(0.92, 0.99, 0.94), elevTint * 0.16);

    float cloudShadow = fbm(vUv * 7.5 + vec2(uTime * 0.018, -uTime * 0.011));
    color *= mix(0.92, 1.01, smoothstep(0.28, 0.82, cloudShadow));

    // Geographic seasonal transition: a wave travels outward from its origin.
    // The imagery stays intact. Only colour grading changes inside the wave.
    vec3 mangoGrade = vec3(1.055, 1.032, 0.965);
    vec3 dryGrade = vec3(1.095, 1.005, 0.86);
    vec3 floodGrade = vec3(0.86, 1.02, 1.125);
    vec3 oldGrade = uSeasonFrom < 0.5 ? mangoGrade : (uSeasonFrom < 1.5 ? dryGrade : floodGrade);
    vec3 newGrade = uSeasonTo < 0.5 ? mangoGrade : (uSeasonTo < 1.5 ? dryGrade : floodGrade);
    // Slight procedural scalloping prevents the wipe from resembling a hard circular mask.
    float irregularity = (fbm(vUv * 10.0) - 0.5) * 0.062;
    float radius = distance(vUv, uWaveOrigin) + irregularity;
    float transitioned = 1.0 - smoothstep(uWaveRadius - uWaveFeather, uWaveRadius + uWaveFeather, radius);
    color *= mix(oldGrade, newGrade, transitioned);
    // A subtle travelling band of light gives the transition its cinematic sweep.
    float rimDistance = abs(radius - uWaveRadius);
    float waveGlow = exp(-rimDistance * 75.0) * step(uWaveRadius, 1.5);
    color += vec3(0.028, 0.038, 0.031) * waveGlow * (1.0 - smoothstep(0.0, 1.5, uWaveRadius));
    float vignette = smoothstep(0.44, 0.92, distance(vUv, vec2(0.5)));
    color = mix(color, vec3(0.07, 0.13, 0.11), vignette * 0.18);

    if (uAdminOpacity > 0.001) {
      vec4 admin = texture2D(uAdmin, vUv);
      float adminA = admin.a * uAdminOpacity;
      color = color * (1.0 - adminA) + admin.rgb * adminA;
    }

    if (uHoverFade > 0.001 && uHoverId > 0.5) {
      float id = communeId(vUv);
      if (abs(id - uHoverId) < 0.5) {
        vec2 adminTexel = vec2(1.0 / 512.0, 1.0 / 256.0);
        float edge = 0.0;
        edge = max(edge, step(0.5, abs(communeId(vUv + vec2(adminTexel.x, 0.0)) - id)));
        edge = max(edge, step(0.5, abs(communeId(vUv - vec2(adminTexel.x, 0.0)) - id)));
        edge = max(edge, step(0.5, abs(communeId(vUv + vec2(0.0, adminTexel.y)) - id)));
        edge = max(edge, step(0.5, abs(communeId(vUv - vec2(0.0, adminTexel.y)) - id)));
        color = mix(color, vec3(0.97, 0.93, 0.72), 0.2 * uHoverFade);
        color = mix(color, vec3(1.0, 0.985, 0.88), edge * 0.7 * uHoverFade);
      }
    }

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

const RIVER_VERTEX = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RIVER_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPos;
  void main() {
    float sweep = sin(vWorldPos.x * 0.55 + vWorldPos.z * 0.36 - uTime * 1.1) * 0.5 + 0.5;
    float ripples = sin(vWorldPos.x * 2.1 - uTime * 1.9) * sin(vWorldPos.z * 1.6 - uTime * 1.5);
    float sparkle = pow(clamp(sweep * 0.72 + ripples * 0.28, 0.0, 1.0), 6.0) * 0.18;
    vec3 base = mix(vec3(0.06, 0.19, 0.23), vec3(0.2, 0.48, 0.54), 0.5 + sweep * 0.2);
    vec3 color = base + vec3(sparkle);
    gl_FragColor = vec4(color, 0.84);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function buildTerrainGeometry(assets: MapAssets, segments: number) {
  const { projector, dem } = assets;
  const segX = segments;
  const segZ = Math.max(
    40,
    Math.round(segments * (projector.depthKm / projector.widthKm)),
  );
  const cols = segX + 1;
  const rows = segZ + 1;
  const positions = new Float32Array(cols * rows * 3);
  const uvs = new Float32Array(cols * rows * 2);
  const heights = new Float32Array(cols * rows);

  for (let row = 0; row < rows; row++) {
    const v = 1 - row / segZ;
    for (let col = 0; col < cols; col++) {
      const u = col / segX;
      const i = row * cols + col;
      const x = (u - 0.5) * projector.widthKm;
      const z = (0.5 - v) * projector.depthKm;
      const height = elevationToScene(dem.sample(u, v));
      heights[i] = height;
      positions[i * 3] = x;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = z;
      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;
    }
  }

  const normals = new Float32Array(cols * rows * 3);
  const cellX = projector.widthKm / segX;
  const cellZ = projector.depthKm / segZ;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      const left = row * cols + Math.max(0, col - 1);
      const right = row * cols + Math.min(segX, col + 1);
      const down = Math.max(0, row - 1) * cols + col;
      const up = Math.min(segZ, row + 1) * cols + col;
      const dx = (heights[right] - heights[left]) / (2 * cellX);
      const dz = (heights[up] - heights[down]) / (2 * cellZ);
      const inv = 1 / Math.hypot(dx, 1, dz);
      normals[i * 3] = -dx * inv;
      normals[i * 3 + 1] = inv;
      normals[i * 3 + 2] = -dz * inv;
    }
  }

  const indices = new Uint32Array(segX * segZ * 6);
  let p = 0;
  for (let row = 0; row < segZ; row++) {
    for (let col = 0; col < segX; col++) {
      const a = row * cols + col;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices[p++] = a;
      indices[p++] = c;
      indices[p++] = b;
      indices[p++] = b;
      indices[p++] = c;
      indices[p++] = d;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.setIndex(new BufferAttribute(indices, 1));
  return geometry;
}

export function Terrain({ assets, segments = 160, onHoverId }: TerrainProps) {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const geometry = useMemo(
    () => buildTerrainGeometry(assets, segments),
    [assets, segments],
  );

  const material = useMemo(() => {
    const image = assets.imagery.image as { width?: number; height?: number } | undefined;
    const width = image?.width ?? 2048;
    const height = image?.height ?? 2048;
    const uniforms = UniformsUtils.merge([
      UniformsLib.fog,
      {
        uImagery: { value: null },
        uMask: { value: null },
        uAdmin: { value: null },
        uAdminId: { value: null },
        uImageryOffset: { value: new Vector2() },
        uImageryRepeat: { value: new Vector2(1, 1) },
        uImageryTexel: { value: new Vector2(1 / width, 1 / height) },
        uAdminOpacity: { value: 0.22 },
        uHoverId: { value: 0 },
        uHoverFade: { value: 0 },
        uTime: { value: 0 },
        uSeasonFrom: { value: 0 },
        uSeasonTo: { value: 0 },
        uWaveOrigin: { value: new Vector2(0.5, 0.5) },
        uWaveRadius: { value: 3 },
        uWaveFeather: { value: 0.095 },
      },
    ]);
    const next = new ShaderMaterial({
      uniforms,
      vertexShader: TERRAIN_VERTEX,
      fragmentShader: TERRAIN_FRAGMENT,
      fog: true,
    });
    next.uniforms.uImagery.value = assets.imagery;
    next.uniforms.uMask.value = assets.mask;
    next.uniforms.uAdmin.value = assets.admin;
    next.uniforms.uAdminId.value = assets.adminIdTexture;
    next.uniforms.uImageryOffset.value.copy(assets.imagery.offset);
    next.uniforms.uImageryRepeat.value.copy(assets.imagery.repeat);
    return next;
  }, [assets]);

  const materialRef = useRef<ShaderMaterial | null>(null);
  const hoverId = useRef(0);
  const hoverFade = useRef(0);
  const { hoveredId, season } = useMapUI();
  const wave = useRef({ from: 0, to: 0, start: -100, running: false });
  const elapsedRef = useRef(0);
  const SEASON_WAVE_DURATION = 2.1;
  const seasonIndex = season === "mango" ? 0 : season === "dry" ? 1 : 2;

  useEffect(() => {
    if (seasonIndex === wave.current.to) return;
    // Commit a previous transition before starting another. No abrupt colour changes
    // when a user repeatedly clicks filters during the wave.
    wave.current = {
      from: wave.current.to,
      to: seasonIndex,
      start: elapsedRef.current,
      running: true,
    };
    const current = materialRef.current;
    if (current) {
      // Trigger the wave from the middle of the terrain (UV coordinates).
      // Other origins can be supplied later from a chosen checkpoint.
      current.uniforms.uWaveOrigin.value.set(0.5, 0.5);
    }
    invalidate();
  }, [seasonIndex, invalidate]);

  useEffect(() => {
    materialRef.current = material;
    return () => {
      materialRef.current = null;
      material.dispose();
    };
  }, [material]);

  useEffect(() => {
    if (hoveredId != null) hoverId.current = hoveredId + 1;
  }, [hoveredId]);

  useFrame((state, dt) => {
    const target = hoveredId != null ? 1 : 0;
    const next =
      hoverFade.current + (target - hoverFade.current) * Math.min(1, dt * 12);
    const current = materialRef.current;
    if (current) {
      elapsedRef.current = state.clock.elapsedTime;
      current.uniforms.uTime.value = elapsedRef.current;
      const transition = wave.current;
      const elapsed = Math.max(0, elapsedRef.current - transition.start);
      const fraction = transition.running
        ? Math.min(1, elapsed / SEASON_WAVE_DURATION)
        : 1;
      const eased = fraction * fraction * (3 - 2 * fraction);
      current.uniforms.uSeasonFrom.value = transition.from;
      current.uniforms.uSeasonTo.value = transition.to;
      // The maximum distance to any corner from center is sqrt(.5).
      current.uniforms.uWaveRadius.value = transition.running ? -0.08 + 0.98 * eased : 3;
      if (transition.running && fraction >= 1) {
        transition.running = false;
        transition.from = transition.to;
      }
      if (transition.running) invalidate();
      current.uniforms.uHoverId.value = next > 0.004 ? hoverId.current : 0;
      current.uniforms.uHoverFade.value = next;
    }
    hoverFade.current = next;
    if (Math.abs(target - next) > 0.002) invalidate();
  });

  useLayoutEffect(() => {
    applyTextureQuality(assets, gl.capabilities.getMaxAnisotropy());
  }, [assets, gl]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const locate = (event: ThreeEvent<PointerEvent>) => {
    const uv = event.uv;
    if (!uv) return null;
    return idAt(
      assets.adminIds,
      assets.adminWidth,
      assets.adminHeight,
      uv.x,
      uv.y,
    );
  };

  return (
    <>
      <mesh geometry={geometry} material={material} matrixAutoUpdate={false} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, elevationToScene(assets.maxHeightMeters) + 0.6, 0]}
        onPointerMove={
          onHoverId
            ? (event) => {
                event.stopPropagation();
                onHoverId(locate(event));
              }
            : undefined
        }
        onPointerOut={onHoverId ? () => onHoverId(null) : undefined}
      >
        <planeGeometry
          args={[assets.projector.widthKm, assets.projector.depthKm]}
        />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  );
}

type RiversProps = {
  assets: MapAssets;
  y: number;
};

function buildRiverGeometry(assets: MapAssets, y: number) {
  const { projector, rivers } = assets;
  const halfW = projector.widthKm / 2;
  const halfD = projector.depthKm / 2;
  const positions: number[] = [];
  const indices: number[] = [];

  const addLine = (line: number[][], widthKm: number) => {
    for (let i = 0; i < line.length - 1; i++) {
      const [lon0, lat0] = line[i];
      const [lon1, lat1] = line[i + 1];
      if (
        Math.abs(lon0 - projector.center[0]) > 0.9 ||
        Math.abs(lon1 - projector.center[0]) > 0.9 ||
        Math.abs(lat0 - projector.center[1]) > 0.6 ||
        Math.abs(lat1 - projector.center[1]) > 0.6
      ) {
        continue;
      }
      const [x0, z0] = projector.toLocal(lon0, lat0);
      const [x1, z1] = projector.toLocal(lon1, lat1);
      if (
        Math.abs(x0) > halfW * 1.02 ||
        Math.abs(x1) > halfW * 1.02 ||
        Math.abs(z0) > halfD * 1.02 ||
        Math.abs(z1) > halfD * 1.02
      ) {
        continue;
      }
      const midLon = (lon0 + lon1) / 2;
      const midLat = (lat0 + lat1) / 2;
      if (!geometryContains(assets.geometry, midLon, midLat)) continue;
      const dx = x1 - x0;
      const dz = z1 - z0;
      const len = Math.hypot(dx, dz) || 1;
      const nx = (-dz / len) * (widthKm / 2);
      const nz = (dx / len) * (widthKm / 2);
      const base = positions.length / 3;
      positions.push(
        x0 + nx,
        y,
        z0 + nz,
        x0 - nx,
        y,
        z0 - nz,
        x1 + nx,
        y,
        z1 + nz,
        x1 - nx,
        y,
        z1 - nz,
      );
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  };

  for (const feature of rivers.features) {
    const geom = feature.geometry;
    const lines =
      geom.type === "LineString"
        ? [geom.coordinates as number[][]]
        : (geom.coordinates as number[][][]);
    const isMekong = feature.properties.name === "Mekong";
    for (const line of lines) addLine(line, isMekong ? 0.48 : 0.16);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.setIndex(indices);
  return geometry;
}

export function Rivers({ assets, y }: RiversProps) {
  const geometry = useMemo(() => buildRiverGeometry(assets, y), [assets, y]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: RIVER_VERTEX,
        fragmentShader: RIVER_FRAGMENT,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
      }),
    [],
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <mesh geometry={geometry} material={material} matrixAutoUpdate={false} />;
}

type OutlineProps = {
  assets: MapAssets;
  y: number;
};

export function ProvinceOutline({ assets, y }: OutlineProps) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    forEachRing(assets.geometry, (ring) => {
      for (let i = 0; i < ring.length - 1; i++) {
        const [x0, z0] = assets.projector.toLocal(ring[i][0], ring[i][1]);
        const [x1, z1] = assets.projector.toLocal(
          ring[i + 1][0],
          ring[i + 1][1],
        );
        positions.push(x0, y, z0, x1, y, z1);
      }
    });
    const next = new BufferGeometry();
    next.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(positions), 3),
    );
    return next;
  }, [assets, y]);

  const material = useMemo(
    () =>
      new LineBasicMaterial({
        color: "#f4edd2",
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return (
    <lineSegments
      geometry={geometry}
      material={material}
      matrixAutoUpdate={false}
      frustumCulled={false}
    />
  );
}
