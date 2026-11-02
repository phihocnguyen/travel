"use client";

import { useMapUI } from "@/components/map/MapUIContext";

/**
 * A masked light falloff around the projected checkpoint.
 * The ring, shade and crosshair follow --focus-x / --focus-y from the 3D scene;
 * --focus-strength fades the whole effect in and out while scrolling.
 */
export default function CheckpointFocus() {
  const { explored } = useMapUI();
  if (explored) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[19] isolate overflow-hidden" aria-hidden="true">
      <div className="cinematic-focus-shade absolute inset-0 opacity-[var(--focus-strength)]" />
      <div className="absolute left-[var(--focus-x)] top-[var(--focus-y)] h-48 w-48 rounded-full border border-mango/60 opacity-[var(--focus-strength)] shadow-[0_0_72px_rgba(254,178,18,0.3)] [transform:translate(-50%,-50%)_scale(calc(0.82+0.18*var(--focus-strength)))]">
        <span className="absolute inset-6 rounded-full border border-dashed border-cream/50" />
      </div>
      <div className="absolute left-[var(--focus-x)] top-[var(--focus-y)] -translate-x-1/2 -translate-y-1/2 text-lg text-cream opacity-[var(--focus-strength)] [text-shadow:0_0_18px_rgba(253,197,16,0.9)]">
        +
      </div>
    </div>
  );
}
