"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  SRGBColorSpace,
  Vector3,
  type WebGLRenderer,
} from "three";
import { loadMapAssetsOnce, unsubscribeMapAssets } from "@/lib/map/assetLoader";
import type { MapAssets } from "@/lib/map/assets";
import { ATTRACTIONS } from "@/lib/map/attractions";
import { useMapUI } from "./MapUIContext";
import { JOURNEY_CHECKPOINTS } from "@/components/journey/journeyData";
import { AdminOverlay } from "./AdminOverlay";
import { Atmosphere } from "./Atmosphere";
import { AttractionMarkers } from "./AttractionMarkers";
import { CameraRig } from "./CameraRig";
import { MangoGroves } from "@/components/landscape/MangoGroves";
import { PerfOverlay } from "./PerfOverlay";
import {
  ProvinceOutline,
  Rivers,
  Terrain,
  elevationToScene,
} from "./Terrain";

const OVERVIEW: [number, number, number] = [0, 108, 114];
const MAX_DPR = 2;
const MIN_DPR = 0.8;
const PIXEL_BUDGET = 8_300_000;
const SOFTWARE_DPR = 0.7;
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|software|basic render|warp/i;

function clampDpr(value: number) {
  return Math.min(MAX_DPR, Math.max(MIN_DPR, Number(value.toFixed(2))));
}

function detectSoftwareRenderer(gl: WebGLRenderer) {
  try {
    const context = gl.getContext();
    const info = context.getExtension("WEBGL_debug_renderer_info");
    const name = String(
      info
        ? context.getParameter(info.UNMASKED_RENDERER_WEBGL)
        : context.getParameter(context.RENDERER),
    );
    return SOFTWARE_RENDERER.test(name);
  } catch {
    return false;
  }
}

function initialDpr() {
  if (typeof window === "undefined") return 1;
  const pixels = window.innerWidth * window.innerHeight;
  if (!pixels) return 1;
  const budgetDpr = Math.sqrt(PIXEL_BUDGET / pixels);
  const deviceDpr = Math.max(window.devicePixelRatio || 1, 1.35);
  return clampDpr(Math.min(deviceDpr, budgetDpr));
}

function debugEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function makeSkyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#1a2d28");
  gradient.addColorStop(0.2, "#13241f");
  gradient.addColorStop(0.6, "#0d1815");
  gradient.addColorStop(1, "#08100e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 512);

  const glow = ctx.createRadialGradient(2, 156, 12, 2, 156, 180);
  glow.addColorStop(0, "rgba(184,214,194,0.22)");
  glow.addColorStop(1, "rgba(184,214,194,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 4, 512);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function FallbackGround() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[360, 220, 1, 1]} />
        <meshBasicMaterial color="#0f1916" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[176, 92, 40, 24]} />
        <meshBasicMaterial color="#16241e" />
      </mesh>
    </group>
  );
}

function SceneSync({ demand }: { demand: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  const { explored, hoveredId, selectedAttractionId } = useMapUI();

  useEffect(() => {
    invalidate();
  }, [invalidate, demand, explored, hoveredId, selectedAttractionId]);

  return null;
}


// Projects the geographic checkpoint to a stable screen-space focus mask.
// DOM styles are written directly: no per-frame React state updates.
const projected = new Vector3();
function CheckpointScreenBridge({ assets }: { assets: MapAssets }) {
  const { activeChapter, explored } = useMapUI();
  const { camera, size } = useThree();
  useFrame(() => {
    if (explored || activeChapter < 1 || activeChapter > JOURNEY_CHECKPOINTS.length) return;
    const attraction = JOURNEY_CHECKPOINTS[activeChapter - 1].attraction;
    const [x, z] = assets.projector.toLocal(attraction.lon, attraction.lat);
    projected.set(x, elevationToScene(assets.maxHeightMeters) + 1, z).project(camera);
    const stage = document.querySelector<HTMLElement>("[data-journey-stage]");
    if (!stage) return;
    const px = (projected.x * 0.5 + 0.5) * size.width;
    const py = (-projected.y * 0.5 + 0.5) * size.height;
    const clampedX = Math.min(size.width * 0.85, Math.max(size.width * 0.15, px));
    const clampedY = Math.min(size.height * 0.8, Math.max(size.height * 0.2, py));
    stage.style.setProperty("--focus-x", `${clampedX}px`);
    stage.style.setProperty("--focus-y", `${clampedY}px`);
  });
  return null;
}

function SceneContent() {
  const {
    explored,
    selectedAttractionId,
    setHoveredId,
    setLoadProgress,
    setReady,
  } = useMapUI();
  const [assets, setAssets] = useState<MapAssets | null>(null);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (assets) invalidate();
  }, [assets, invalidate]);

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
      rivers: base + 0.025,
      admin: base + 0.06,
      outline: base + 0.13,
    };
  }, [assets]);

  const focusPoint = useMemo(() => {
    if (!assets || selectedAttractionId == null) return null;
    const attraction = ATTRACTIONS[selectedAttractionId];
    if (!attraction) return null;
    const [x, z] = assets.projector.toLocal(attraction.lon, attraction.lat);
    return { x, z };
  }, [assets, selectedAttractionId]);

  return (
    <>
      <fog attach="fog" args={["#102019", 95, 360]} />

      {assets && layers ? (
        <>
          <Terrain assets={assets} segments={288} onHoverId={setHoveredId} />
          <Rivers assets={assets} y={layers.rivers} />
          <AdminOverlay assets={assets} y={layers.admin} />
          <ProvinceOutline assets={assets} y={layers.outline} />
          <MangoGroves assets={assets} />
          <Atmosphere assets={assets} base={layers.base} />
          <AttractionMarkers assets={assets} y={layers.outline + 0.18} />
          <CheckpointScreenBridge assets={assets} />
        </>
      ) : (
        <FallbackGround />
      )}

      <CameraRig
        ready={!!assets}
        explored={explored}
        focusPoint={focusPoint}
        overview={OVERVIEW}
        assets={assets}
      />
    </>
  );
}

export default function MapScene() {
  const [dpr, setDpr] = useState(initialDpr);
  const [software, setSoftware] = useState(false);
  const [debug] = useState(debugEnabled);

  return (
    <Canvas
      dpr={dpr}
      frameloop={software ? "demand" : "always"}
      camera={{ position: [0, 186, 212], fov: 41, near: 0.1, far: 900 }}
      gl={{
        antialias: true,
        alpha: false,
        depth: true,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
        precision: "highp",
      }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.16;
        gl.shadowMap.enabled = false;
        gl.shadowMap.autoUpdate = false;
        gl.shadowMap.needsUpdate = false;
        gl.setClearColor("#09110f", 1);
        scene.background = makeSkyTexture();
        if (detectSoftwareRenderer(gl)) {
          setSoftware(true);
          setDpr(SOFTWARE_DPR);
        }
      }}
    >
      {!software && (
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setDpr((value) => clampDpr(value - 0.1))}
          onIncline={() => setDpr((value) => clampDpr(value + 0.06))}
        />
      )}
      <SceneSync demand={software} />
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
      {debug && <PerfOverlay />}
    </Canvas>
  );
}
