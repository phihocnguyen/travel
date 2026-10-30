"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Euler,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  SRGBColorSpace,
  ShaderMaterial,
  Vector3,
} from "three";
import { ATTRACTIONS, CATEGORY_COLORS } from "@/lib/map/attractions";
import type { MapAssets } from "@/lib/map/assets";
import { useMapUI } from "./MapUIContext";

type Props = {
  assets: MapAssets;
  y: number;
};

const FLAT = new Euler(-Math.PI / 2, 0, 0);
const FLAT_QUAT = new Quaternion().setFromEuler(FLAT);
const IDENTITY_QUAT = new Quaternion();
const BEAM_HEIGHT = 5.2;
const HIT_HEIGHT = 7;
const HIT_RADIUS = 1.6;

const BEAM_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vTint;
  void main() {
    vUv = uv;
    #ifdef USE_INSTANCING_COLOR
      vTint = instanceColor;
    #else
      vTint = vec3(1.0);
    #endif
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const BEAM_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vTint;
  void main() {
    float bottom = smoothstep(0.0, 0.16, vUv.y);
    float top = 1.0 - smoothstep(0.45, 1.0, vUv.y);
    float alpha = bottom * top * uOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(vTint, alpha);
    #include <colorspace_fragment>
  }
`;

function makeGlowTexture() {
  const size = 64;
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
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function AttractionMarkers({ assets, y }: Props) {
  const { selectedAttractionId, setSelectedAttractionId, setHoveredId } =
    useMapUI();
  const [hovered, setHovered] = useState<number | null>(null);
  const ringRef = useRef<InstancedMesh>(null);
  const beamRef = useRef<InstancedMesh>(null);
  const headRef = useRef<InstancedMesh>(null);
  const hitRef = useRef<InstancedMesh>(null);
  const focusRef = useRef<Mesh>(null);
  const focusMaterial = useRef<MeshBasicMaterial>(null);
  const invalidate = useThree((state) => state.invalidate);

  const points = useMemo(
    () =>
      ATTRACTIONS.map((attraction) => {
        const [x, z] = assets.projector.toLocal(attraction.lon, attraction.lat);
        return { attraction, x, z };
      }),
    [assets],
  );

  const glowTexture = useMemo(() => makeGlowTexture(), []);
  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  const glowGeometry = useMemo(() => {
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);
    const color = new Color();
    points.forEach(({ attraction, x, z }, index) => {
      positions[index * 3] = x;
      positions[index * 3 + 1] = y + BEAM_HEIGHT;
      positions[index * 3 + 2] = z;
      color.set(CATEGORY_COLORS[attraction.category]).toArray(
        colors,
        index * 3,
      );
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    return geometry;
  }, [points, y]);

  useEffect(() => () => glowGeometry.dispose(), [glowGeometry]);

  useLayoutEffect(() => {
    const flatMatrix = new Matrix4();
    const beamMatrix = new Matrix4();
    const hitMatrix = new Matrix4();
    const position = new Vector3();
    const scale = new Vector3(1, 1, 1);
    const beamScale = new Vector3(1, BEAM_HEIGHT, 1);
    const color = new Color();

    points.forEach(({ attraction, x, z }, index) => {
      position.set(x, y, z);
      flatMatrix.compose(position, FLAT_QUAT, scale);
      ringRef.current?.setMatrixAt(index, flatMatrix);
      ringRef.current?.setColorAt(
        index,
        color.set(CATEGORY_COLORS[attraction.category]),
      );

      position.set(x, y + BEAM_HEIGHT / 2, z);
      beamMatrix.compose(position, IDENTITY_QUAT, beamScale);
      beamRef.current?.setMatrixAt(index, beamMatrix);
      beamRef.current?.setColorAt(
        index,
        color.set(CATEGORY_COLORS[attraction.category]),
      );

      position.set(x, y + BEAM_HEIGHT, z);
      flatMatrix.compose(position, IDENTITY_QUAT, scale);
      headRef.current?.setMatrixAt(index, flatMatrix);
      headRef.current?.setColorAt(
        index,
        color.set(CATEGORY_COLORS[attraction.category]),
      );

      // Generous invisible pick volume. It sits above the terrain, so the ray
      // always reaches it before the ground and checkpoint hover wins over
      // commune hover. The material is not rendered at all.
      position.set(x, y + HIT_HEIGHT / 2, z);
      hitMatrix.compose(position, IDENTITY_QUAT, scale);
      hitRef.current?.setMatrixAt(index, hitMatrix);
    });

    for (const mesh of [
      ringRef.current,
      beamRef.current,
      headRef.current,
      hitRef.current,
    ]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [points, y]);

  const activeIndex = hovered ?? selectedAttractionId;
  const activePoint =
    activeIndex == null ? null : points[activeIndex] ?? null;

  // Scale only the hovered/selected marker instances; the rest of the buffer
  // stays untouched so hovering never rebuilds the whole instanced mesh.
  const prevActive = useRef<number | null>(null);
  useLayoutEffect(() => {
    const ring = ringRef.current;
    const beam = beamRef.current;
    const head = headRef.current;
    if (!ring || !beam || !head) return;
    const flatMatrix = new Matrix4();
    const matrix = new Matrix4();
    const position = new Vector3();
    const scale = new Vector3();

    const write = (index: number, size: number) => {
      const point = points[index];
      if (!point) return;
      position.set(point.x, y, point.z);
      scale.setScalar(size);
      flatMatrix.compose(position, FLAT_QUAT, scale);
      ring.setMatrixAt(index, flatMatrix);

      position.set(point.x, y + BEAM_HEIGHT / 2, point.z);
      matrix.compose(
        position,
        IDENTITY_QUAT,
        scale.set(1, BEAM_HEIGHT * size, 1),
      );
      beam.setMatrixAt(index, matrix);

      position.set(point.x, y + BEAM_HEIGHT, point.z);
      matrix.compose(position, IDENTITY_QUAT, scale.setScalar(size));
      head.setMatrixAt(index, matrix);
    };

    const previous = prevActive.current;
    if (previous != null && previous !== activeIndex) write(previous, 1);
    if (activeIndex != null) write(activeIndex, 1.35);
    prevActive.current = activeIndex;

    ring.instanceMatrix.needsUpdate = true;
    beam.instanceMatrix.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
  }, [activeIndex, points, y]);

  useLayoutEffect(() => {
    if (!focusRef.current) return;
    if (!activePoint) {
      focusRef.current.visible = false;
      return;
    }
    focusRef.current.visible = true;
    focusRef.current.position.set(activePoint.x, y + 0.01, activePoint.z);
    if (focusMaterial.current) {
      focusMaterial.current.color.set(
        CATEGORY_COLORS[activePoint.attraction.category],
      );
    }
  }, [activePoint, y]);

  // Demand rendering needs an explicit frame when local hover/selection state
  // changes; the focus ring itself stays static so an open panel costs no CPU.
  useEffect(() => {
    invalidate();
  }, [hovered, selectedAttractionId, invalidate]);

  useEffect(() => {
    document.body.style.cursor = hovered != null ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  useEffect(
    () => () => {
      ringRef.current?.geometry.dispose();
      beamRef.current?.geometry.dispose();
      headRef.current?.geometry.dispose();
      hitRef.current?.geometry.dispose();
      const ringMaterial = ringRef.current?.material;
      const beamMaterial = beamRef.current?.material;
      const headMaterial = headRef.current?.material;
      const hitMaterial = hitRef.current?.material;
      if (ringMaterial instanceof MeshBasicMaterial) ringMaterial.dispose();
      if (beamMaterial instanceof ShaderMaterial) beamMaterial.dispose();
      if (headMaterial instanceof MeshBasicMaterial) headMaterial.dispose();
      if (hitMaterial instanceof MeshBasicMaterial) hitMaterial.dispose();
      focusRef.current?.geometry.dispose();
      focusMaterial.current?.dispose();
    },
    [],
  );

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (typeof event.instanceId === "number") {
      // The pick volume covers the terrain underneath, so explicitly drop the
      // commune tooltip while a checkpoint is hovered.
      setHoveredId(null);
      setHovered(event.instanceId);
    }
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (typeof event.instanceId !== "number") return;
    setHoveredId(null);
    setSelectedAttractionId(
      selectedAttractionId === event.instanceId ? null : event.instanceId,
    );
  };

  return (
    <group>
      <instancedMesh
        ref={ringRef}
        args={[undefined, undefined, points.length]}
        frustumCulled={false}
        matrixAutoUpdate={false}
      >
        <ringGeometry args={[0.56, 0.96, 28, 1]} />
        <meshBasicMaterial
          transparent
          opacity={0.9}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh
        ref={beamRef}
        args={[undefined, undefined, points.length]}
        frustumCulled={false}
        matrixAutoUpdate={false}
      >
        <cylinderGeometry args={[0.1, 0.2, 1, 8, 1, true]} />
        <shaderMaterial
          vertexShader={BEAM_VERTEX}
          fragmentShader={BEAM_FRAGMENT}
          uniforms={{ uOpacity: { value: 0.5 } }}
          transparent
          depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh
        ref={headRef}
        args={[undefined, undefined, points.length]}
        frustumCulled={false}
        matrixAutoUpdate={false}
      >
        <octahedronGeometry args={[0.3, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <points geometry={glowGeometry} frustumCulled={false}>
        <pointsMaterial
          map={glowTexture}
          size={2.8}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>

      <instancedMesh
        ref={hitRef}
        args={[undefined, undefined, points.length]}
        onPointerMove={handleMove}
        onPointerOut={() => setHovered(null)}
        onClick={handleClick}
        frustumCulled={false}
        matrixAutoUpdate={false}
      >
        <cylinderGeometry args={[HIT_RADIUS, HIT_RADIUS, HIT_HEIGHT, 8, 1]} />
        <meshBasicMaterial visible={false} />
      </instancedMesh>

      <mesh
        ref={focusRef}
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      >
        <ringGeometry args={[1.35, 1.55, 40]} />
        <meshBasicMaterial
          ref={focusMaterial}
          transparent
          opacity={0.85}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {activePoint && (
        <Html
          position={[activePoint.x, y + BEAM_HEIGHT + 0.7, activePoint.z]}
          center
          zIndexRange={[45, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="attraction-marker-label">
            <span
              className="attraction-marker-label__category"
              style={{
                color: CATEGORY_COLORS[activePoint.attraction.category],
              }}
            >
              {activePoint.attraction.category}
            </span>
            <span className="attraction-marker-label__name">
              {activePoint.attraction.name}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
