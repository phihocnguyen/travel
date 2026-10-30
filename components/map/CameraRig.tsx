"use client";

import { useEffect, useMemo, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { CatmullRomCurve3, MathUtils, PerspectiveCamera, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { JOURNEY_CHECKPOINTS } from "@/components/journey/journeyData";
import { useMapUI } from "./MapUIContext";
import type { MapAssets } from "@/lib/map/assets";

type FocusPoint = { x: number; z: number } | null;
type Props = {
  ready: boolean;
  explored: boolean;
  focusPoint: FocusPoint;
  overview: [number, number, number];
  assets?: MapAssets | null;
};

type Pose = { position: Vector3; target: Vector3; fov: number };
const scratchPos = new Vector3();
const scratchTarget = new Vector3();

const smooth = (t: number) => {
  const x = MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

export function CameraRig({ ready, explored, focusPoint, overview, assets }: Props) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const { journeyProgress } = useMapUI();
  const controls = useRef<OrbitControlsImpl>(null);
  const lookTarget = useRef(new Vector3());
  const focusPosition = useRef(new Vector3());
  const focusTarget = useRef(new Vector3());
  const focusing = useRef(false);
  const lastFocus = useRef<FocusPoint>(null);
  const modeRef = useRef(false);

  const route = useMemo(() => {
    const poses: Pose[] = [{
      position: new Vector3(...overview),
      target: new Vector3(0, 0, 0),
      fov: 43,
    }];
    if (assets) {
      const width = assets.projector.widthKm;
      const depth = assets.projector.depthKm;
      const approach = Math.max(16, Math.min(width, depth) * 0.3);
      JOURNEY_CHECKPOINTS.forEach(({ attraction }, index) => {
        const [x, z] = assets.projector.toLocal(attraction.lon, attraction.lat);
        const side = index % 2 === 0 ? 1 : -1;
        poses.push({
          position: new Vector3(x + side * approach * 0.32, approach * 1.15, z + approach * 1.08),
          target: new Vector3(x, 0, z),
          fov: 38,
        });
      });
    }
    poses.push({
      position: new Vector3(overview[0], overview[1] * 0.9, overview[2] * 0.91),
      target: new Vector3(0, 0, 0),
      fov: 43,
    });
    return {
      poses,
      positions: new CatmullRomCurve3(poses.map((p) => p.position), false, "centripetal", 0.35),
      targets: new CatmullRomCurve3(poses.map((p) => p.target), false, "centripetal", 0.35),
    };
  }, [assets, overview]);

  useEffect(() => {
    if (!focusPoint || focusPoint === lastFocus.current) return;
    lastFocus.current = focusPoint;
    focusPosition.current.set(focusPoint.x + 8, 36, focusPoint.z + 31);
    focusTarget.current.set(focusPoint.x, 0, focusPoint.z);
    focusing.current = true;
  }, [focusPoint]);

  useFrame((_, rawDt) => {
    if (!ready) return;
    const dt = Math.min(rawDt, 0.06);
    const orbit = controls.current;
    const perspective = camera as PerspectiveCamera;
    if (!explored) {
      modeRef.current = false;
      if (orbit) orbit.enabled = false;
      const total = route.poses.length - 1;
      const p = MathUtils.clamp(journeyProgress.current, 0, 1) * total;
      const segment = Math.min(Math.floor(p), total - 1);
      const phase = p - segment;
      // 15% arrival transition; generous stable section near the checkpoint for reading.
      // Going backward uses the same deterministic path.
      const transition = smooth(phase / 0.74);
      const curveT = (segment + transition) / total;
      route.positions.getPoint(curveT, scratchPos);
      route.targets.getPoint(curveT, scratchTarget);

      // A critically damped-like exponential response eliminates wheel-frame jitter.
      // Camera is never independently tweened by GSAP, preventing multiple writers.
      const k = 1 - Math.exp(-dt * 5.8);
      camera.position.lerp(scratchPos, k);
      lookTarget.current.lerp(scratchTarget, k);
      camera.lookAt(lookTarget.current);
      if (orbit) orbit.target.copy(lookTarget.current);

      if (perspective.isPerspectiveCamera) {
        const fov = MathUtils.lerp(route.poses[segment].fov, route.poses[segment + 1].fov, transition);
        const nextFov = MathUtils.lerp(perspective.fov, fov, k);
        if (Math.abs(nextFov - perspective.fov) > 0.002) {
          perspective.fov = nextFov;
          perspective.updateProjectionMatrix();
        }
      }
      invalidate();
      return;
    }

    if (!modeRef.current) {
      modeRef.current = true;
      if (orbit) {
        orbit.target.copy(lookTarget.current);
        orbit.update();
      }
    }
    if (focusing.current) {
      const k = 1 - Math.exp(-dt * 5.6);
      camera.position.lerp(focusPosition.current, k);
      if (orbit) {
        orbit.enabled = false;
        orbit.target.lerp(focusTarget.current, k);
        orbit.update();
      }
      if (camera.position.distanceTo(focusPosition.current) < 0.35 &&
          (!orbit || orbit.target.distanceTo(focusTarget.current) < 0.35)) {
        focusing.current = false;
      }
      invalidate();
    } else if (orbit) {
      orbit.enabled = true;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enabled={false}
      target={[0, 0, 0]}
      enableDamping
      dampingFactor={0.055}
      minDistance={12}
      maxDistance={320}
      minPolarAngle={0.09}
      maxPolarAngle={Math.PI * 0.47}
      zoomSpeed={0.75}
      rotateSpeed={0.5}
      panSpeed={0.65}
    />
  );
}
