"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Euler,
  Group,
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
import { getMarkerIconGeometry, type MarkerIconKind } from "./markerIcons";
import { JOURNEY_CHECKPOINTS } from "@/components/journey/journeyData";

type Props = {
  assets: MapAssets;
  y: number;
};

type IconKind = MarkerIconKind;

const FLAT = new Euler(-Math.PI / 2, 0, 0);
const FLAT_QUAT = new Quaternion().setFromEuler(FLAT);
const IDENTITY_QUAT = new Quaternion();
const BEAM_HEIGHT = 1.75;
const HIT_HEIGHT = 4.2;
const HIT_RADIUS = 1.2;
const NO_RAYCAST = () => null;

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

function resolveIconKind(
  attraction: (typeof ATTRACTIONS)[number],
): IconKind {
  const hay = `${attraction.name} ${attraction.category}`.toLowerCase();
  if (/pagoda|temple|shrine|stupa|chùa|phật/.test(hay)) return "pagoda";
  if (/lotus|flower|blossom|sen/.test(hay)) return "lotus";
  if (/ancient house|old house|village|homestay|house/.test(hay)) return "house";
  if (/market|floating market|chợ/.test(hay)) return "market";
  if (/beach|islet|coast|sea|palm/.test(hay)) return "palm";
  if (/mango|orchard|grove/.test(hay)) {
    return "mango";
  }
  return "landmark";
}

function ExtrudedCheckpointIcon({
  kind,
  tint,
  emphasis,
}: {
  kind: IconKind;
  tint: string;
  emphasis: boolean;
}) {
  const geometry = useMemo(() => getMarkerIconGeometry(kind), [kind]);
  const frontMaterial = useMemo(
    () => new MeshBasicMaterial({ color: tint, toneMapped: false }),
    [tint],
  );
  const sideMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(tint).multiplyScalar(0.52),
        toneMapped: false,
      }),
    [tint],
  );

  useEffect(
    () => () => {
      frontMaterial.dispose();
      sideMaterial.dispose();
    },
    [frontMaterial, sideMaterial],
  );

  return (
    <mesh
      geometry={geometry}
      material={[frontMaterial, sideMaterial]}
      scale={emphasis ? 1.1 : 0.82}
    />
  );
}

/** Y-axis billboard: keeps the extruded icon facing the camera while the base
 *  ring stays flat on the ground. */
function IconBillboard({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null);
  const world = useMemo(() => new Vector3(), []);
  useFrame(({ camera }) => {
    const current = group.current;
    if (!current) return;
    current.getWorldPosition(world);
    current.rotation.y = Math.atan2(
      camera.position.x - world.x,
      camera.position.z - world.z,
    );
  });
  return <group ref={group}>{children}</group>;
}

function resolveOverlaps(
  points: { x: number; z: number }[],
  minDistance: number,
) {
  const placed = points.map((point) => ({ x: point.x, z: point.z }));
  for (let iteration = 0; iteration < 40; iteration++) {
    let moved = false;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const dx = placed[j].x - placed[i].x;
        const dz = placed[j].z - placed[i].z;
        const distance = Math.hypot(dx, dz);
        if (distance >= minDistance) continue;
        // For coincident points use a deterministic direction so the result is
        // stable across renders.
        const angle = distance > 0.0001
          ? Math.atan2(dz, dx)
          : ((i * 73 + j * 127) % 360) * (Math.PI / 180);
        const push = (minDistance - distance) / 2 + 0.001;
        const ux = Math.cos(angle);
        const uz = Math.sin(angle);
        placed[i].x -= ux * push;
        placed[i].z -= uz * push;
        placed[j].x += ux * push;
        placed[j].z += uz * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return placed;
}

export function AttractionMarkers({ assets, y }: Props) {
  const {
    selectedAttractionId,
    setSelectedAttractionId,
    setHoveredId,
    activeChapter,
    explored,
    season,
  } = useMapUI();
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

  // Two Sa Dec checkpoints (Huynh Thuy Le house and Kien An Cung pagoda) are
  // only ~150 m apart, so their enlarged icons would overlap. Spread display
  // positions apart while the small ground ring stays on the true coordinate.
  const displayPoints = useMemo(() => {
    const minDistance = Math.max(
      1.8,
      Math.min(assets.projector.widthKm, assets.projector.depthKm) * 0.016,
    );
    const placed = resolveOverlaps(points, minDistance);
    return points.map((point, index) => ({
      ...point,
      x: placed[index].x,
      z: placed[index].z,
    }));
  }, [points, assets]);

  const moved = useMemo(
    () =>
      displayPoints
        .map((point, index) => ({ point, index }))
        .filter(({ point, index }) => Math.hypot(
          point.x - points[index].x,
          point.z - points[index].z,
        ) > 0.02),
    [displayPoints, points],
  );

  const leaderGeometry = useMemo(() => {
    if (!moved.length) return null;
    const positions = new Float32Array(moved.length * 6);
    moved.forEach(({ point, index }, i) => {
      positions[i * 6] = points[index].x;
      positions[i * 6 + 1] = y + 0.02;
      positions[i * 6 + 2] = points[index].z;
      positions[i * 6 + 3] = point.x;
      positions[i * 6 + 4] = y + 0.02;
      positions[i * 6 + 5] = point.z;
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    return geometry;
  }, [moved, points, y]);

  useEffect(() => () => leaderGeometry?.dispose(), [leaderGeometry]);

  const glowTexture = useMemo(() => makeGlowTexture(), []);
  useEffect(() => () => glowTexture.dispose(), [glowTexture]);

  const glowGeometry = useMemo(() => {
    const positions = new Float32Array(displayPoints.length * 3);
    const colors = new Float32Array(displayPoints.length * 3);
    const color = new Color();
    displayPoints.forEach(({ attraction, x, z }, index) => {
      positions[index * 3] = x;
      positions[index * 3 + 1] = y + BEAM_HEIGHT;
      positions[index * 3 + 2] = z;
      color.set(CATEGORY_COLORS[attraction.category]).toArray(colors, index * 3);
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    return geometry;
  }, [displayPoints, y]);

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
      const display = displayPoints[index];
      position.set(x, y, z);
      flatMatrix.compose(position, FLAT_QUAT, scale);
      ringRef.current?.setMatrixAt(index, flatMatrix);
      ringRef.current?.setColorAt(index, color.set(CATEGORY_COLORS[attraction.category]));

      position.set(display.x, y + BEAM_HEIGHT / 2, display.z);
      beamMatrix.compose(position, IDENTITY_QUAT, beamScale);
      beamRef.current?.setMatrixAt(index, beamMatrix);
      beamRef.current?.setColorAt(index, color.set(CATEGORY_COLORS[attraction.category]));

      position.set(display.x, y + BEAM_HEIGHT, display.z);
      flatMatrix.compose(position, IDENTITY_QUAT, scale);
      headRef.current?.setMatrixAt(index, flatMatrix);
      headRef.current?.setColorAt(index, color.set(CATEGORY_COLORS[attraction.category]));

      position.set(display.x, y + HIT_HEIGHT / 2, display.z);
      hitMatrix.compose(position, IDENTITY_QUAT, scale);
      hitRef.current?.setMatrixAt(index, hitMatrix);
    });

    for (const mesh of [ringRef.current, beamRef.current, headRef.current, hitRef.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [points, displayPoints, y]);

  const journeyIndex = !explored && activeChapter > 0 && activeChapter <= JOURNEY_CHECKPOINTS.length
    ? JOURNEY_CHECKPOINTS[activeChapter - 1].index
    : null;
  const activeIndex = hovered ?? selectedAttractionId ?? journeyIndex;
  const activePoint = activeIndex == null ? null : displayPoints[activeIndex] ?? null;

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
      const point = displayPoints[index];
      const anchor = points[index];
      if (!point || !anchor) return;
      position.set(anchor.x, y, anchor.z);
      scale.setScalar(size);
      flatMatrix.compose(position, FLAT_QUAT, scale);
      ring.setMatrixAt(index, flatMatrix);

      position.set(point.x, y + BEAM_HEIGHT / 2, point.z);
      matrix.compose(position, IDENTITY_QUAT, scale.set(1, BEAM_HEIGHT * size, 1));
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
  }, [activeIndex, displayPoints, points, y]);

  useLayoutEffect(() => {
    if (!focusRef.current) return;
    if (!activePoint) {
      focusRef.current.visible = false;
      return;
    }
    focusRef.current.visible = true;
    focusRef.current.position.set(activePoint.x, y + 0.01, activePoint.z);
    if (focusMaterial.current) {
      focusMaterial.current.color.set(CATEGORY_COLORS[activePoint.attraction.category]);
    }
  }, [activePoint, y]);

  useEffect(() => {
    invalidate();
  }, [hovered, selectedAttractionId, season, invalidate]);

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
      setHoveredId(null);
      setHovered(event.instanceId);
    }
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (typeof event.instanceId !== "number") return;
    setHoveredId(null);
    setSelectedAttractionId(selectedAttractionId === event.instanceId ? null : event.instanceId);
  };

  return (
    <group>
      <instancedMesh ref={ringRef} args={[undefined, undefined, points.length]} frustumCulled={false} matrixAutoUpdate={false}>
        <ringGeometry args={[0.32, 0.48, 28, 1]} />
        <meshBasicMaterial transparent opacity={0.52} depthWrite={false} side={DoubleSide} toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={beamRef} args={[undefined, undefined, points.length]} frustumCulled={false} matrixAutoUpdate={false} visible={false}>
        <cylinderGeometry args={[0.1, 0.2, 1, 8, 1, true]} />
        <shaderMaterial
          vertexShader={BEAM_VERTEX}
          fragmentShader={BEAM_FRAGMENT}
          uniforms={{ uOpacity: { value: 0.22 } }}
          transparent
          depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </instancedMesh>

      <instancedMesh ref={headRef} args={[undefined, undefined, points.length]} frustumCulled={false} matrixAutoUpdate={false}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <points geometry={glowGeometry} frustumCulled={false}>
        <pointsMaterial
          map={glowTexture}
          size={1.5}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>

      {displayPoints.map(({ attraction, x, z }, index) => {
        const accent = CATEGORY_COLORS[attraction.category];
        const kind = resolveIconKind(attraction);
        const emphasis = activeIndex === index;
        return (
          <group key={`${attraction.name}-${index}`} position={[x, y + BEAM_HEIGHT + 0.3, z]} scale={emphasis ? 0.98 : 0.7}>
            <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={NO_RAYCAST}>
              <ringGeometry args={[0.52, 0.7, 22]} />
              <meshBasicMaterial color={accent} transparent opacity={emphasis ? 0.46 : 0.26} toneMapped={false} />
            </mesh>
            <IconBillboard>
              <ExtrudedCheckpointIcon kind={kind} tint={accent} emphasis={emphasis} />
            </IconBillboard>
          </group>
        );
      })}

      {leaderGeometry && (
        <lineSegments geometry={leaderGeometry} raycast={NO_RAYCAST}>
          <lineBasicMaterial color="#f3e4b0" transparent opacity={0.4} depthWrite={false} toneMapped={false} />
        </lineSegments>
      )}

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

      <mesh ref={focusRef} visible={false} rotation={[-Math.PI / 2, 0, 0]} raycast={NO_RAYCAST}>
        <ringGeometry args={[0.68, 0.83, 40]} />
        <meshBasicMaterial ref={focusMaterial} transparent opacity={0.85} depthWrite={false} side={DoubleSide} toneMapped={false} />
      </mesh>

      {activePoint && (
        <Html position={[activePoint.x, y + BEAM_HEIGHT + 1.1, activePoint.z]} center zIndexRange={[45, 0]} style={{ pointerEvents: "none" }}>
          <div className="attraction-marker-label">
            <span className="attraction-marker-label__category" style={{ color: CATEGORY_COLORS[activePoint.attraction.category] }}>
              {activePoint.attraction.category}
            </span>
            <span className="attraction-marker-label__name">{activePoint.attraction.name}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
