"use client";

import dynamic from "next/dynamic";

const MapScene = dynamic(() => import("@/components/map/MapScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#0b1210]" aria-hidden />
  ),
});

export default function MapCanvas() {
  return (
    <div className="absolute inset-0">
      <MapScene />
    </div>
  );
}
