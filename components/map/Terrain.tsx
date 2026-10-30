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

/**
 * One opaque pass for the whole map. Imagery, province clip mask, commune tint
 * and the hovered-zone highlight all share the same UV space, so they are
 * composited in the fragment shader instead of stacking transparent quads.
 * Lighting is a cheap normal-based hillshade baked from the DEM geometry:
 * enough depth to read the relief without a light or shadow pass.
 */
const TERRAIN_VERTEX = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
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
  uniform float uAdminOpacity;
  uniform float uHoverId;
  uniform float uHoverFade;
  varying vec2 vUv;
  varying vec3 vNormal;

  float communeId(vec2 uv) {
    return floor(texture2D(uAdminId, uv).r * 255.0 + 0.5);
  }

  void main() {
    // Cheap mask fetch first: everything outside the province is discarded
    // before paying for the colour atlases.
    vec4 mask = texture2D(uMask, vUv);
    if (mask.g < 0.45) discard;

    vec2 imageryUv = vUv * uImageryRepeat + uImageryOffset;
    vec3 color = texture2D(uImagery, imageryUv).rgb;

    // Soft directional hillshade. The delta is almost flat, so the range is
    // wide enough to keep the relief readable without looking metallic.
    vec3 n = normalize(vNormal);
    float sun = clamp(dot(n, normalize(vec3(-0.45, 0.82, 0.35))), 0.0, 1.0);
    color *= mix(0.88, 1.14, sun);

    // Gentle saturation/contrast lift; satellite tiles are a little muted
    // compared with a hand-painted Primland-style terrain.
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, 1.12);
    color = clamp((color - 0.5) * 1.06 + 0.5, 0.0, 1.0);

    if (uAdminOpacity > 0.001) {
      vec4 admin = texture2D(uAdmin, vUv);
      float adminA = admin.a * uAdminOpacity;
      color = color * (1.0 - adminA) + admin.rgb * adminA;
    }

    // Hovered commune: tint the whole zone and trace its border by comparing
    // ids with the four neighbouring texels. Only runs while hovering.
    if (uHoverFade > 0.001 && uHoverId > 0.5) {
      float id = communeId(vUv);
      if (abs(id - uHoverId) < 0.5) {
        vec2 texel = vec2(1.0 / 512.0, 1.0 / 256.0);
        float edge = 0.0;
        edge = max(edge, step(0.5, abs(communeId(vUv + vec2(texel.x, 0.0)) - id)));
        edge = max(edge, step(0.5, abs(communeId(vUv - vec2(texel.x, 0.0)) - id)));
        edge = max(edge, step(0.5, abs(communeId(vUv + vec2(0.0, texel.y)) - id)));
        edge = max(edge, step(0.5, abs(communeId(vUv - vec2(0.0, texel.y)) - id)));
        color = mix(color, vec3(0.96, 0.91, 0.68), 0.22 * uHoverFade);
        color = mix(color, vec3(1.0, 0.97, 0.84), edge * 0.62 * uHoverFade);
      }
    }

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

function buildTerrainGeometry(assets: MapAssets, segments: number) {
  const { projector, dem } = assets;
  const segX = segments;
  const segZ = Math.max(40, Math.round(segments * (projector.depthKm / projector.widthKm)));
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

  // Baked normals from central differences. This lets the fragment shader do
  // a single dot() per pixel for the hillshade, with no light or normal map.
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
    const uniforms = UniformsUtils.merge([
      UniformsLib.fog,
      {
        uImagery: { value: null },
        uMask: { value: null },
        uAdmin: { value: null },
        uAdminId: { value: null },
        uImageryOffset: { value: new Vector2() },
        uImageryRepeat: { value: new Vector2(1, 1) },
        uAdminOpacity: { value: 0.28 },
        uHoverId: { value: 0 },
        uHoverFade: { value: 0 },
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
  const { hoveredId } = useMapUI();

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

  // Fade the zone highlight in/out. Only frames while the fade is still
  // moving request a redraw, so a resting hover costs nothing.
  useFrame((_, dt) => {
    const target = hoveredId != null ? 1 : 0;
    const next = hoverFade.current + (target - hoverFade.current) * Math.min(1, dt * 12);
    const current = materialRef.current;
    if (current) {
      current.uniforms.uHoverId.value =
        next > 0.004 ? hoverId.current : 0;
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

      {/* Invisible flat pick plane. Raycasting the 130k-triangle terrain on
          every pointer move is the main source of hover stutter; this plane
          has two triangles and shares the exact terrain UV space. Sits just
          above the highest peak so it always wins the intersection. */}
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
        <planeGeometry args={[assets.projector.widthKm, assets.projector.depthKm]} />
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
        x0 + nx, y, z0 + nz,
        x0 - nx, y, z0 - nz,
        x1 + nx, y, z1 + nz,
        x1 - nx, y, z1 - nz,
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
      new MeshBasicMaterial({
        color: "#4b98a6",
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
      }),
    [],
  );

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
  // Every ring used to be its own drei <Line> (one draw call + one fat-line
  // material each). Flatten them into a single LineSegments buffer so the
  // whole province border is a single draw call.
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
        color: "#f6edcf",
        transparent: true,
        opacity: 0.9,
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
