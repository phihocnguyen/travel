"use client";

import MapCanvas from "./MapCanvas";
import AttractionModal from "@/components/hero/AttractionModal";
import JourneyOverlay from "@/components/journey/JourneyOverlay";
import CheckpointFocus from "@/components/effects/CheckpointFocus";
import { MapUIProvider, useMapUI } from "./MapUIContext";
import "@/components/journey/journey.css";

function ExperienceStage() {
  const { explored } = useMapUI();
  return (
    <main data-journey-scroll-space className={`journey-scroll-space${explored ? " journey-scroll-space--explored" : ""}`}>
      <div data-journey-stage className="journey-stage">
        <div className="journey-map"><MapCanvas /></div>
        <div className="map-vignette" aria-hidden />
        <CheckpointFocus />
        <JourneyOverlay />
        {explored && (
          <div className="absolute left-5 top-5 z-40 rounded-full border border-white/20 bg-black/40 px-5 py-3 text-xs tracking-widest text-white backdrop-blur-md">
            KÉO CHUỘT ĐỂ KHÁM PHÁ BẢN ĐỒ
          </div>
        )}
        <AttractionModal />
      </div>
    </main>
  );
}

export default function MapExperience() {
  return <MapUIProvider><ExperienceStage /></MapUIProvider>;
}
