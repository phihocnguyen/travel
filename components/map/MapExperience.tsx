"use client";

import HeaderAccount from "@/components/auth/HeaderAccount";
import MapExplorer from "./MapExplorer";
import MapCanvas from "./MapCanvas";
import AttractionModal from "@/components/hero/AttractionModal";
import JourneyOverlay from "@/components/journey/JourneyOverlay";
import { CHECKPOINT_COUNT } from "@/components/journey/journeyData";
import CheckpointFocus from "@/components/effects/CheckpointFocus";
import IntroSequence from "@/components/hero/IntroSequence";
import { MapUIProvider, useMapUI } from "./MapUIContext";

function ExperienceStage() {
  const { explored, ready, introOpen, explore } = useMapUI();
  return (
    <main
      data-journey-scroll-space
      className="relative w-full overflow-visible bg-[#0b2a1b]"
      style={{ height: explored ? "100dvh" : `${CHECKPOINT_COUNT * 200 + 100}dvh` }}
    >
      <div
        data-journey-stage
        className="fixed inset-0 isolate z-0 h-dvh w-full overflow-hidden bg-[#0b2a1b] shadow-[inset_0_0_170px_60px_rgba(5,25,16,0.62)] [--focus-strength:0] [--focus-x:50%] [--focus-y:50%]"
      >
        <div className="absolute inset-0">
          <MapCanvas />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] bg-[linear-gradient(180deg,rgba(8,36,23,0.18),transparent_22%,transparent_72%,rgba(8,36,23,0.3))]"
        />
        <CheckpointFocus />
        <IntroSequence />
        <JourneyOverlay />
        <div className="absolute right-4 top-4 z-[110] sm:right-6 sm:top-6"><HeaderAccount navigation /></div>
        {explored && (
          <div className="absolute left-4 top-4 z-40 rounded-full border border-cream/30 bg-forest/80 px-5 py-3 text-[9px] font-bold uppercase tracking-[0.22em] text-cream backdrop-blur-md sm:left-6 sm:top-6 sm:text-[10px]">
            Kéo để khám phá bản đồ
          </div>
        )}
        {!explored && ready && !introOpen && <button type="button" onClick={() => { explore(false); window.scrollTo({top: 0, behavior: 'instant'}); }} className="absolute bottom-6 right-4 z-[70] rounded-full border border-cream/30 bg-forest/90 px-5 py-3 text-xs font-semibold text-cream backdrop-blur-md hover:bg-forest focus-visible:outline-2 focus-visible:outline-cream sm:right-6">Khám phá tự do ↗</button>}
        <MapExplorer />
        <AttractionModal />
      </div>
    </main>
  );
}

export default function MapExperience() {
  return (
    <MapUIProvider>
      <ExperienceStage />
    </MapUIProvider>
  );
}
