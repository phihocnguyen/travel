"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  SRGBColorSpace,
  type WebGLRenderer,
} from "three";
import { loadMapAssetsOnce, unsubscribeMapAssets } from "@/lib/map/assetLoader";
import type { MapAssets } from "@/lib/map/assets";
import { ATTRACTIONS } from "@/lib/map/attractions";
import { useMapUI } from "./MapUIContext";
import { AdminOverlay } from "./AdminOverlay";
import { Atmosphere } from "./Atmosphere";
import { AttractionMarkers } from "./AttractionMarkers";
import { CameraRig } from "./CameraRig";
import { PerfOverlay } from "./PerfOverlay";
import {
  ProvinceOutline,
  Rivers,
  Terrain,
  elevationToScene,
} from "./Terrain";

const OVERVIEW: [number, number, number] = [0, 122, 118];
// Hardware GPUs get supersampled edges; the budget still prevents a 4K retina
// window from quadrupling the pixel count for no visible gain.
const MAX_DPR = 2;
const MIN_DPR = 0.75;
const PIXEL_BUDGET = 8_300_000;
// Software rasterisers (Microsoft Basic Render Driver / WARP, SwiftShader,
// llvmpipe) shade every pixel on the CPU, so we stop at a lower resolution and
// only redraw when something actually changes.
const SOFTWARE_DPR = 0.7;
const SOFTWARE_RENDERER =
  /swiftshader|llvmpipe|software|basic render|warp/i;

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
  // On a 1080p desktop (devicePixelRatio = 1) we still want a little
  // supersampling so the terrain texture stays crisp while orbiting.
  const deviceDpr = Math.max(window.devicePixelRatio || 1, 1.4);
  return clampDpr(Math.min(deviceDpr, budgetDpr));
}

function debugEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function makeSkyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#0d1a15");
  gradient.addColorStop(0.5, "#1b3329");
  gradient.addColorStop(1, "#070f0b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 256);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
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

function SceneSync({ demand }: { demand: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  const { explored, hoveredId, selectedAttractionId } = useMapUI();

  // In demand mode React state changes do not schedule a frame on their own,
  // so any visual state change has to poke the render loop explicitly.
  useEffect(() => {
    invalidate();
  }, [invalidate, demand, explored, hoveredId, selectedAttractionId]);

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
      rivers: base + 0.02,
      admin: base + 0.06,
      outline: base + 0.14,
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
      <fog attach="fog" args={["#13251e", 110, 400]} />

      {assets && layers ? (
        <>
          <Terrain
            assets={assets}
            segments={256}
            onHoverId={setHoveredId}
          />
          <Rivers assets={assets} y={layers.rivers} />
          <AdminOverlay assets={assets} y={layers.admin} />
          <ProvinceOutline assets={assets} y={layers.outline} />
          <Atmosphere assets={assets} base={layers.base} />
          <AttractionMarkers assets={assets} y={layers.outline + 0.2} />
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
  const [software, setSoftware] = useState(false);
  const [debug] = useState(debugEnabled);

  return (
    <Canvas
      dpr={dpr}
      frameloop={software ? "demand" : "always"}
      camera={{ position: [0, 182, 192], fov: 46, near: 0.1, far: 900 }}
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
        gl.toneMappingExposure = 1.1;
        // The whole scene is unlit (MeshBasic/custom materials), so the
        // shadow pipeline would only cost a per-frame shadow map pass.
        gl.shadowMap.enabled = false;
        gl.shadowMap.autoUpdate = false;
        gl.shadowMap.needsUpdate = false;
        gl.setClearColor("#0a1411", 1);
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
          onDecline={() => setDpr((value) => clampDpr(value - 0.12))}
          onIncline={() => setDpr((value) => clampDpr(value + 0.08))}
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
