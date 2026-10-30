"use client";

import { useEffect, useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  DoubleSide,
  MeshBasicMaterial,
  RingGeometry,
  type Mesh,
} from "three";
import { idAt } from "@/lib/geo/adminTextures";
import type { MapAssets } from "@/lib/map/assets";
import { useMapUI } from "./MapUIContext";

type Props = {
  assets: MapAssets;
  y: number;
};

export function AdminOverlay({ assets, y }: Props) {
  const {
    showAdmin,
    hoveredId,
    selectedId,
    setHoveredId,
    setSelectedId,
    setSelectedAttractionId,
    explored,
  } = useMapUI();
  const labelMaterial = useRef<MeshBasicMaterial>(null);
  const labelMesh = useRef<Mesh>(null);
  const labelOpacity = useRef(0);
  const highlightRef = useRef<Mesh>(null);
  const highlightMaterial = useRef<MeshBasicMaterial>(null);

  const { widthKm, depthKm } = assets.projector;

  const activeId = hoveredId ?? selectedId;
  const active = activeId == null ? null : assets.communes[activeId];

  // Allocated once for the lifetime of the overlay: hovering a commune only
  // moves/colour-swaps this single ring instead of rebuilding geometry.
  const highlightRing = useMemo(() => new RingGeometry(0.95, 1.18, 48), []);
  useEffect(() => () => highlightRing.dispose(), [highlightRing]);

  useEffect(() => {
    document.body.style.cursor = hoveredId != null ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hoveredId]);

  useFrame((state, dt) => {
    const height = state.camera.position.y;
    const target = explored && height < 82 ? Math.min(1, (82 - height) / 38) : 0;
    if (
      Math.abs(target - labelOpacity.current) < 0.001 &&
      (target === 0 || target === 1)
    ) {
      return;
    }
    labelOpacity.current +=
      (target - labelOpacity.current) * Math.min(1, dt * 3);
    if (labelMaterial.current) {
      labelMaterial.current.opacity = labelOpacity.current * 0.9;
    }
    if (labelMesh.current) {
      labelMesh.current.visible = labelOpacity.current > 0.02;
    }
  });

  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const uv = event.uv;
    if (!uv) return;
    const id = idAt(
      assets.adminIds,
      assets.adminWidth,
      assets.adminHeight,
      uv.x,
      uv.y,
    );
    setHoveredId(id);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const uv = event.uv;
    if (!uv) return;
    const id = idAt(
      assets.adminIds,
      assets.adminWidth,
      assets.adminHeight,
      uv.x,
      uv.y,
    );
    setSelectedId(id);
    if (id != null) setSelectedAttractionId(null);
  };

  const activePos = active
    ? assets.projector.toLocal(active.lon, active.lat)
    : null;

  useEffect(() => {
    const mesh = highlightRef.current;
    const material = highlightMaterial.current;
    if (!mesh || !material) return;
    const visible = !!active && !!activePos;
    mesh.visible = visible;
    if (!visible || !activePos) return;
    mesh.position.set(activePos[0], y + 0.02, activePos[1]);
    material.color.set(activeId === selectedId ? "#f4e7bc" : "#ffffff");
  }, [active, activePos, activeId, selectedId, y]);

  return (
    <group visible={showAdmin}>
      <mesh
        position={[0, y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handleMove}
        onPointerOut={() => setHoveredId(null)}
        onClick={handleClick}
      >
        <planeGeometry args={[widthKm, depthKm, 1, 1]} />
        <meshBasicMaterial
          map={assets.admin}
          transparent
          opacity={0.52}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      <mesh
        ref={labelMesh}
        visible={false}
        position={[0, y + 0.012, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      >
        <planeGeometry args={[widthKm, depthKm, 1, 1]} />
        <meshBasicMaterial
          ref={labelMaterial}
          map={assets.labels}
          transparent
          opacity={0}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      <mesh
        ref={highlightRef}
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={highlightRing}
        raycast={() => null}
      >
        <meshBasicMaterial
          ref={highlightMaterial}
          transparent
          opacity={0.85}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      {active && activePos && (
        <Html
          position={[activePos[0], y + 0.3, activePos[1]]}
          center
          zIndexRange={[40, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="admin-tooltip">
            <span className="admin-tooltip__kind">{active.kind}</span>
            <span className="admin-tooltip__name">{active.name}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
