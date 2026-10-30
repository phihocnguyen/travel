"use client";

import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

type FocusPoint = { x: number; z: number } | null;

type Props = {
  ready: boolean;
  explored: boolean;
  focusPoint: FocusPoint;
  overview: [number, number, number];
};

const INTRO_SECONDS = 4.6;

export function CameraRig({ ready, explored, focusPoint, overview }: Props) {
  const camera = useThree((state) => state.camera);
  const controls = useRef<OrbitControlsImpl>(null);
  const mode = useRef<"intro" | "idle" | "focus">("intro");
  const introTime = useRef(0);
  const startPos = useRef(new Vector3());
  const goalPos = useRef(new Vector3(...overview));
  const goalTarget = useRef(new Vector3(0, 0, 0));
  const overviewRef = useRef(overview);
  const started = useRef(false);
  const lastFocus = useRef<FocusPoint>(null);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    startPos.current.copy(camera.position);
    mode.current = "intro";
    introTime.current = 0;
  }, [ready, camera]);

  useEffect(() => {
    if (!focusPoint) {
      if (lastFocus.current) {
        lastFocus.current = null;
        goalPos.current.set(...overviewRef.current);
        goalTarget.current.set(0, 0, 0);
        mode.current = "focus";
      }
      return;
    }
    if (focusPoint === lastFocus.current) return;
    lastFocus.current = focusPoint;
    goalPos.current.set(focusPoint.x, 46, focusPoint.z + 40);
    goalTarget.current.set(focusPoint.x, 0, focusPoint.z);
    mode.current = "focus";
  }, [focusPoint]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const orbit = controls.current;
    if (!ready) return;

    if (mode.current === "intro") {
      introTime.current += dt;
      const t = MathUtils.clamp(introTime.current / INTRO_SECONDS, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(startPos.current, goalPos.current, eased);
      camera.lookAt(0, 0, 0);
      if (t >= 1) mode.current = "idle";
      if (orbit) orbit.enabled = false;
      return;
    }

    if (mode.current === "focus") {
      const k = 1 - Math.pow(0.001, dt);
      camera.position.lerp(goalPos.current, k);
      if (orbit) {
        orbit.target.lerp(goalTarget.current, k);
        orbit.enabled = false;
      }
      if (camera.position.distanceTo(goalPos.current) < 0.6) {
        mode.current = "idle";
        if (orbit) {
          orbit.enabled = explored;
          orbit.update();
        }
      }
      return;
    }

    if (orbit) orbit.enabled = explored;
  });

  return (
    <OrbitControls
      ref={controls}
      enabled={false}
      target={[0, 0, 0]}
      enableDamping
      dampingFactor={0.06}
      minDistance={14}
      maxDistance={320}
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI * 0.46}
      zoomSpeed={0.8}
      rotateSpeed={0.55}
      panSpeed={0.7}
    />
  );
}
