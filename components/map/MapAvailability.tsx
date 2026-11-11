"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import MapExperience from "./MapExperience";

const desktopQuery = "(min-width: 1024px)";
function subscribe(onChange: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export default function MapAvailability() {
  const desktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(desktopQuery).matches,
    () => false,
  );

  if (desktop) return <MapExperience />;

  return (
    <section className="flex min-h-dvh items-center justify-center bg-[#102c22] px-6 py-12 text-center text-[#f7f1db]">
      <div className="w-full max-w-md rounded-[2rem] border border-white/15 bg-white/5 px-7 py-10 shadow-2xl backdrop-blur-sm">
        <div aria-hidden="true" className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-[#e4c36b]/40 bg-[#e4c36b]/10 text-3xl">🗺️</div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#e4c36b]">Bản đồ 3D Cao Lãnh</p>
        <h1 className="text-2xl font-semibold leading-snug">Chức năng này chỉ khả dụng trên giao diện máy tính</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/70">Vui lòng mở trang bằng máy tính để khám phá bản đồ tương tác.</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-[#e4c36b] px-6 py-3 text-sm font-semibold text-[#163629] transition hover:bg-[#f4d98a]">Về trang chủ</Link>
      </div>
    </section>
  );
}
