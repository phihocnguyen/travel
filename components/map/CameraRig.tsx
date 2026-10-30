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

const INTRO_SECONDS = 4.8;
const TEMP = new Vector3();

export function CameraRig({ ready, explored, focusPoint, overview }: Props) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const controls = useRef<OrbitControlsImpl>(null);
  const mode = useRef<"intro" | "idle" | "focus">("intro");
  const introTime = useRef(0);
  const startPos = useRef(new Vector3());
  const goalPos = useRef(new Vector3(...overview));
  const goalTarget = useRef(new Vector3(0, 0, 0));
  const started = useRef(false);
  const lastFocus = useRef<FocusPoint>(null);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    startPos.current.copy(camera.position);
    goalPos.current.set(overview[0], overview[1], overview[2]);
    mode.current = "intro";
    introTime.current = 0;
  }, [ready, camera, overview]);

  useEffect(() => {
    if (!focusPoint) return;
    if (focusPoint === lastFocus.current) return;
    lastFocus.current = focusPoint;
    const panelOffset = 6.5;
    goalPos.current.set(focusPoint.x + panelOffset, 34, focusPoint.z + 28);
    goalTarget.current.set(focusPoint.x, 1.2, focusPoint.z);
    mode.current = "focus";
  }, [focusPoint]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const orbit = controls.current;
    if (!ready) return;

    if (mode.current === "intro") {
      introTime.current += dt;
      const t = MathUtils.clamp(introTime.current / INTRO_SECONDS, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      TEMP.copy(goalPos.current);
      TEMP.x += Math.sin(t * Math.PI) * 22;
      TEMP.z += (1 - eased) * 20;
      camera.position.lerpVectors(startPos.current, TEMP, eased);
      camera.lookAt(0, 0, 0);
      if (orbit) {
        orbit.target.lerp(new Vector3(0, 0, 0), 0.14);
        orbit.enabled = false;
      }
      if (t >= 1) mode.current = "idle";
      invalidate();
      return;
    }

    if (mode.current === "focus") {
      const k = 1 - Math.pow(0.001, dt);
      camera.position.lerp(goalPos.current, k);
      if (orbit) {
        orbit.target.lerp(goalTarget.current, k);
        orbit.enabled = false;
      }
      if (camera.position.distanceTo(goalPos.current) < 0.55) {
        mode.current = "idle";
        if (orbit) {
          orbit.enabled = explored;
          orbit.update();
        }
      }
      invalidate();
      return;
    }

    if (orbit) {
      orbit.enabled = explored;
      if (explored && !focusPoint) {
        orbit.target.lerp(goalTarget.current.set(0, 0, 0), 0.05);
      }
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enabled={false}
      target={[0, 0, 0]}
      enableDamping
      dampingFactor={0.055}
      minDistance={16}
      maxDistance={260}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI * 0.42}
      zoomSpeed={0.75}
      rotateSpeed={0.48}
      panSpeed={0.64}
      screenSpacePanning={false}
    />
  );
}
