"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  Color,
  DoubleSide,
  Euler,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
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
export function AttractionMarkers({ assets, y }: Props) {
  const {
    selectedAttractionId,
    setSelectedAttractionId,
    setSelectedId,
  } = useMapUI();
  const [hovered, setHovered] = useState<number | null>(null);
  const ringRef = useRef<InstancedMesh>(null);
  const dotRef = useRef<InstancedMesh>(null);
  const focusRef = useRef<Mesh>(null);
  const focusMaterial = useRef<MeshBasicMaterial>(null);

  const points = useMemo(
    () =>
      ATTRACTIONS.map((attraction) => {
        const [x, z] = assets.projector.toLocal(attraction.lon, attraction.lat);
        return { attraction, x, z };
      }),
    [assets],
  );

  useLayoutEffect(() => {
    const matrix = new Matrix4();
    const position = new Vector3();
    const scale = new Vector3();
    points.forEach(({ attraction, x, z }, index) => {
      const active =
        selectedAttractionId === attraction.id || hovered === attraction.id;
      const size = active ? 1.18 : 1;
      position.set(x, y, z);
      scale.set(size, size, size);
      matrix.compose(position, FLAT_QUAT, scale);
      ringRef.current?.setMatrixAt(index, matrix);
      dotRef.current?.setMatrixAt(index, matrix);
      const color = new Color(CATEGORY_COLORS[attraction.category]);
      ringRef.current?.setColorAt(index, color);
      dotRef.current?.setColorAt(index, new Color("#f7f1dd"));
    });
    if (ringRef.current) {
      ringRef.current.instanceMatrix.needsUpdate = true;
      if (ringRef.current.instanceColor)
        ringRef.current.instanceColor.needsUpdate = true;
    }
    if (dotRef.current) {
      dotRef.current.instanceMatrix.needsUpdate = true;
      if (dotRef.current.instanceColor)
        dotRef.current.instanceColor.needsUpdate = true;
    }
  }, [points, y, hovered, selectedAttractionId]);

  const activeIndex = hovered ?? selectedAttractionId;
  const activePoint =
    activeIndex == null ? null : points[activeIndex] ?? null;

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

  useFrame((state) => {
    if (!focusRef.current || !focusRef.current.visible) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.08;
    focusRef.current.scale.setScalar(pulse);
  });

  useEffect(() => {
    document.body.style.cursor = hovered != null ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  useEffect(
    () => () => {
      ringRef.current?.geometry.dispose();
      dotRef.current?.geometry.dispose();
      const ringMaterial = ringRef.current?.material;
      const dotMaterial = dotRef.current?.material;
      if (ringMaterial instanceof MeshBasicMaterial) ringMaterial.dispose();
      if (dotMaterial instanceof MeshBasicMaterial) dotMaterial.dispose();
      focusRef.current?.geometry.dispose();
      focusMaterial.current?.dispose();
    },
    [],
  );

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (typeof event.instanceId === "number") {
      setHovered(event.instanceId);
    }
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (typeof event.instanceId !== "number") return;
    const next = selectedAttractionId === event.instanceId
      ? null
      : event.instanceId;
    if (next != null) setSelectedId(null);
    setSelectedAttractionId(next);
  };

  return (
    <group>
      <instancedMesh
        ref={ringRef}
        args={[undefined, undefined, points.length]}
        onPointerMove={handleMove}
        onPointerOut={() => setHovered(null)}
        onClick={handleClick}
        frustumCulled={false}
      >
        <ringGeometry args={[0.3, 0.82, 20, 1]} />
        <meshBasicMaterial
          transparent
          opacity={0.92}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>

      <instancedMesh
        ref={dotRef}
        args={[undefined, undefined, points.length]}
        onPointerMove={handleMove}
        onPointerOut={() => setHovered(null)}
        onClick={handleClick}
        frustumCulled={false}
      >
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial
          transparent
          opacity={0.98}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>

      <mesh
        ref={focusRef}
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      >
        <ringGeometry args={[1.15, 1.32, 32]} />
        <meshBasicMaterial
          ref={focusMaterial}
          transparent
          opacity={0.8}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {activePoint && (
        <Html
          position={[activePoint.x, y + 0.4, activePoint.z]}
          center
          zIndexRange={[45, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="attraction-marker-label">
            <span
              className="attraction-marker-label__category"
              style={{
                color:
                  CATEGORY_COLORS[activePoint.attraction.category],
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
