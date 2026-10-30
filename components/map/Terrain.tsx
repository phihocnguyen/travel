"use client";

import { useEffect, useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  MeshBasicMaterial,
  Vector3,
} from "three";
import { forEachRing, geometryContains } from "@/lib/geo/polygon";
import { applyTextureQuality, type MapAssets } from "@/lib/map/assets";

export const EXAGGERATION = 18;

export function elevationToScene(meters: number) {
  return (meters * EXAGGERATION) / 1000;
}

type TerrainProps = {
  assets: MapAssets;
  segments?: number;
};

function buildTerrainGeometry(assets: MapAssets, segments: number) {
  const { projector, dem } = assets;
  const segX = segments;
  const segZ = Math.max(40, Math.round(segments * (projector.depthKm / projector.widthKm)));
  const cols = segX + 1;
  const rows = segZ + 1;
  const positions = new Float32Array(cols * rows * 3);
  const uvs = new Float32Array(cols * rows * 2);

  for (let row = 0; row < rows; row++) {
    const v = 1 - row / segZ;
    for (let col = 0; col < cols; col++) {
      const u = col / segX;
      const i = row * cols + col;
      const x = (u - 0.5) * projector.widthKm;
      const z = (0.5 - v) * projector.depthKm;
      const height = dem.sample(u, v);
      positions[i * 3] = x;
      positions[i * 3 + 1] = elevationToScene(height);
      positions[i * 3 + 2] = z;
      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;
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
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.setIndex(new BufferAttribute(indices, 1));
  return geometry;
}

export function Terrain({ assets, segments = 200 }: TerrainProps) {
  const gl = useThree((state) => state.gl);
  const geometry = useMemo(
    () => buildTerrainGeometry(assets, segments),
    [assets, segments],
  );

  useLayoutEffect(() => {
    applyTextureQuality(assets, gl.capabilities.getMaxAnisotropy());
  }, [assets, gl]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        map={assets.imagery}
        alphaMap={assets.mask}
        alphaTest={0.45}
      />
    </mesh>
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
        color: "#3b7f8c",
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        side: DoubleSide,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <mesh geometry={geometry} material={material} />;
}

type OutlineProps = {
  assets: MapAssets;
  y: number;
};

export function ProvinceOutline({ assets, y }: OutlineProps) {
  const rings = useMemo(() => {
    const result: Vector3[][] = [];
    forEachRing(assets.geometry, (ring) => {
      result.push(
        ring.map(([lon, lat]) => {
          const [x, z] = assets.projector.toLocal(lon, lat);
          return new Vector3(x, y, z);
        }),
      );
    });
    return result;
  }, [assets, y]);

  return (
    <>
      {rings.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#f1e7c8"
          transparent
          opacity={0.85}
          lineWidth={1.4}
        />
      ))}
    </>
  );
}
