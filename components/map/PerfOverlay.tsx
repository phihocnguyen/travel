"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Optional diagnostics overlay, enabled with `?debug=1`.
 * Samples renderer stats roughly twice a second and writes straight to the
 * DOM so it never triggers React re-renders while the scene is running.
 */
export function PerfOverlay() {
  const { gl } = useThree();
  const elRef = useRef<HTMLDivElement | null>(null);
  const frames = useRef(0);
  const elapsed = useRef(0);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.createElement("div");
    el.className = "perf-overlay";
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    elRef.current = el;
    return () => {
      el.remove();
      elRef.current = null;
    };
  }, []);

  useFrame((_, dt) => {
    frames.current += 1;
    elapsed.current += dt;
    if (elapsed.current < 0.5) return;
    const fps = frames.current / elapsed.current;
    const info = gl.info;
    const memory = info.memory;
    if (elRef.current) {
      elRef.current.textContent = [
        `${fps.toFixed(1)} fps · ${(1000 / Math.max(fps, 0.001)).toFixed(1)} ms`,
        `calls ${info.render.calls} · tris ${info.render.triangles.toLocaleString()}`,
        `geo ${memory.geometries} · tex ${memory.textures} · dpr ${gl.getPixelRatio().toFixed(2)}`,
      ].join("\n");
    }
    frames.current = 0;
    elapsed.current = 0;
  });

  return null;
}
