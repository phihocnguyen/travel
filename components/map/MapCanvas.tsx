"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import MapUnavailable from "./MapUnavailable";

const MapScene = dynamic(() => import("@/components/map/MapScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#0b1210]" aria-hidden />
  ),
});

class MapRenderBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { console.warn("Map renderer unavailable; the scroll journey remains available."); }
  render() { return this.state.failed ? <MapUnavailable /> : this.props.children; }
}

export default function MapCanvas() {
  return (
    <div className="absolute inset-0">
      <MapRenderBoundary><MapScene /></MapRenderBoundary>
    </div>
  );
}
