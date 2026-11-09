"use client";

import { useEffect } from "react";
import { useMapUI } from "./MapUIContext";

export default function MapUnavailable() {
  const { setLoadProgress, setReady } = useMapUI();
  useEffect(() => {
    // Keep the document journey usable when WebGL cannot initialize.
    setLoadProgress(1);
    setReady(true);
  }, [setLoadProgress, setReady]);
  return <div className="absolute inset-0 bg-[#0b2a1b]">
    <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('/tram-chim.jpg')" }} />
    <p role="status" className="absolute inset-x-4 top-16 mx-auto max-w-sm rounded-xl border border-cream/15 bg-forest/90 px-4 py-3 text-center text-[11px] leading-relaxed text-cream">
      Chưa thể hiển thị bản đồ 3D trên trình duyệt này. Bạn vẫn có thể cuộn để khám phá hành trình.
    </p>
  </div>;
}
