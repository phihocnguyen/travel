"use client";

import MapCanvas from "./MapCanvas";
import HeroOverlay from "@/components/hero/HeroOverlay";
import AttractionModal from "@/components/hero/AttractionModal";
import { MapUIProvider } from "./MapUIContext";

export default function MapExperience() {
  return (
    <MapUIProvider>
      <div className="relative h-dvh w-full overflow-hidden bg-[#0a1411]">
        <MapCanvas />
        <div className="map-vignette" aria-hidden />
        <HeroOverlay />
        <AttractionModal />
      </div>
    </MapUIProvider>
  );
}
