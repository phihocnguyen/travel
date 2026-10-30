"use client";

import { useMapUI } from "@/components/map/MapUIContext";

/**
 * A masked backdrop blur, not a fake opaque vignette.
 * The hole follows the projected geographic checkpoint from CheckpointScreenBridge.
 * Safari needs -webkit-mask-image, encoded via the CSS stylesheet.
 */
export default function CheckpointFocus() {
  const { explored } = useMapUI();
  if (explored) return null;
  return (
    <div className="cinematic-focus" aria-hidden="true">
      <div className="cinematic-focus__blur" />
      <div className="cinematic-focus__shade" />
      <div className="cinematic-focus__ring" />
      <div className="cinematic-focus__crosshair">+</div>
    </div>
  );
}
