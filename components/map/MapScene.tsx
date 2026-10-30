"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { ACESFilmicToneMapping, Color } from "three";
import { loadMapAssetsOnce, unsubscribeMapAssets } from "@/lib/map/assetLoader";
import type { MapAssets } from "@/lib/map/assets";
import { ATTRACTIONS } from "@/lib/map/attractions";
import { useMapUI } from "./MapUIContext";
import { AdminOverlay } from "./AdminOverlay";
import { AttractionMarkers } from "./AttractionMarkers";
import { CameraRig } from "./CameraRig";
import { NeighborLabels } from "./NeighborLabels";
import { PerfOverlay } from "./PerfOverlay";
import {
  ProvinceOutline,
  Rivers,
  Terrain,
  elevationToScene,
} from "./Terrain";

const OVERVIEW: [number, number, number] = [0, 122, 118];
const PIXEL_BUDGET = 2_200_000;

function initialDpr() {
  if (typeof window === "undefined") return 1;
  const pixels = window.innerWidth * window.innerHeight;
  if (!pixels) return 1;
  return Math.min(1, Math.max(0.6, Math.sqrt(PIXEL_BUDGET / pixels)));
}

function debugEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function FallbackGround() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[360, 220, 1, 1]} />
        <meshBasicMaterial color="#12211b" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[176, 92, 40, 24]} />
        <meshBasicMaterial color="#1b2a1e" />
      </mesh>
    </group>
  );
}

function SceneContent() {
  const { explored, selectedId, selectedAttractionId, setLoadProgress, setReady } =
    useMapUI();
  const [assets, setAssets] = useState<MapAssets | null>(null);

  useEffect(() => {
    let cancelled = false;
    const onProgress = (progress: number) => {
      if (!cancelled) setLoadProgress(progress);
    };

    setLoadProgress(0.02);
    loadMapAssetsOnce(onProgress)
      .then((next) => {
        if (cancelled) return;
        setAssets(next);
        setLoadProgress(1);
        setReady(true);
      })
      .catch((error: unknown) => {
        console.error("Không tải được dữ liệu bản đồ", error);
        if (!cancelled) {
          setLoadProgress(1);
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
      unsubscribeMapAssets(onProgress);
    };
  }, [setLoadProgress, setReady]);

  const layers = useMemo(() => {
    if (!assets) return null;
    const base = elevationToScene(assets.maxHeightMeters);
    return {
      base,
      rivers: base + 0.02,
      admin: base + 0.06,
      labels: base + 0.08,
      outline: base + 0.14,
    };
  }, [assets]);

  const focusPoint = useMemo(() => {
    if (!assets) return null;
    if (selectedAttractionId != null) {
      const attraction = ATTRACTIONS[selectedAttractionId];
      if (!attraction) return null;
      const [x, z] = assets.projector.toLocal(attraction.lon, attraction.lat);
      return { x, z };
    }
    if (selectedId == null) return null;
    const commune = assets.communes[selectedId];
    if (!commune) return null;
    const [x, z] = assets.projector.toLocal(commune.lon, commune.lat);
    return { x, z };
  }, [assets, selectedId, selectedAttractionId]);

  return (
    <>
      <color attach="background" args={["#0a1411"]} />
      <fog attach="fog" args={["#0f1d17", 95, 360]} />

      {assets && layers ? (
        <>
          <FallbackGround />
          <Terrain assets={assets} segments={160} />
          <Rivers assets={assets} y={layers.rivers} />
          <AdminOverlay assets={assets} y={layers.admin} />
          <ProvinceOutline assets={assets} y={layers.outline} />
          <AttractionMarkers assets={assets} y={layers.outline + 0.2} />
          <NeighborLabels
            projector={assets.projector}
            neighbors={assets.meta.neighbors}
            y={layers.labels}
          />
        </>
      ) : (
        <FallbackGround />
      )}

      <CameraRig
        ready={!!assets}
        explored={explored}
        focusPoint={focusPoint}
        overview={OVERVIEW}
      />
    </>
  );
}

export default function MapScene() {
  const [dpr, setDpr] = useState(initialDpr);
  const [debug] = useState(debugEnabled);

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 182, 192], fov: 46, near: 0.1, far: 900 }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.06;
        scene.background = new Color("#0a1411");
      }}
    >
      <PerformanceMonitor
        flipflops={2}
        onDecline={() =>
          setDpr((value) => Math.max(0.55, Number((value - 0.15).toFixed(2))))
        }
        onIncline={() =>
          setDpr((value) => Math.min(1, Number((value + 0.05).toFixed(2))))
        }
      />
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
      {debug && <PerfOverlay />}
    </Canvas>
  );
}
