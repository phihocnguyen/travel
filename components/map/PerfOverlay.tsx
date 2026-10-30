"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Optional diagnostics overlay, enabled with `?debug=1`.
 * Counts frames inside useFrame but samples/writes on a timer, so it still
 * reports something useful when the render loop is idle (`frameloop="demand"`).
 */
export function PerfOverlay() {
  const { gl } = useThree();
  const frames = useRef(0);
  const elapsed = useRef(0);
  const renderer = useRef("unknown");

  useEffect(() => {
    const context = gl.getContext();
    const info = context.getExtension("WEBGL_debug_renderer_info");
    const name = info
      ? context.getParameter(info.UNMASKED_RENDERER_WEBGL)
      : context.getParameter(context.RENDERER);
    renderer.current = String(name || "unknown");
  }, [gl]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.createElement("div");
    el.className = "perf-overlay";
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);

    const timer = window.setInterval(() => {
      const count = frames.current;
      const seconds = elapsed.current;
      const info = gl.info;
      const memory = info.memory;
      const fps = seconds > 0.01 ? count / seconds : 0;
      const head =
        count > 0
          ? `${fps.toFixed(1)} fps · ${(1000 / Math.max(fps, 0.001)).toFixed(1)} ms`
          : "idle · chờ thay đổi";
      el.textContent = [
        head,
        `calls ${info.render.calls} · tris ${info.render.triangles.toLocaleString()}`,
        `geo ${memory.geometries} · tex ${memory.textures} · dpr ${gl.getPixelRatio().toFixed(2)}`,
        `gpu ${renderer.current}`,
      ].join("\n");
      frames.current = 0;
      elapsed.current = 0;
    }, 500);

    return () => {
      window.clearInterval(timer);
      el.remove();
    };
  }, [gl]);

  useFrame((_, dt) => {
    frames.current += 1;
    elapsed.current += dt;
  });

  return null;
}
