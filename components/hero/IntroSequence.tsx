"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useMapUI } from "@/components/map/MapUIContext";

export default function IntroSequence() {
  const { introOpen, ready, loadProgress, dismissIntro } = useMapUI();
  const leaving = ready;
  const progress = Math.round(loadProgress * 100);

  // Hold the page at the first chapter until the atlas is actually usable.
  useEffect(() => {
    if (!introOpen) return;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
    };
  }, [introOpen]);

  // Enter automatically as soon as the atlas is ready — no "begin" button.
  useEffect(() => {
    if (!leaving) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) return;
    const frame = window.requestAnimationFrame(dismissIntro);
    return () => window.cancelAnimationFrame(frame);
  }, [leaving, dismissIntro]);

  if (!introOpen) return null;

  return (
    <section
      className={`fixed inset-0 z-[100] grid grid-rows-[auto_1fr_auto] overflow-hidden bg-cream px-5 py-5 text-forest transition-[opacity,filter,transform] duration-1000 ease-out sm:px-8 sm:py-7 lg:px-14 ${
        leaving
          ? "pointer-events-none scale-[1.03] opacity-0 blur-md"
          : "scale-100 opacity-100 blur-0"
      }`}
      aria-label="Vị Xoài Dẫn Lối — Trạm Hẹn Cao Lãnh"
      aria-hidden={leaving}
      onTransitionEnd={(event) => {
        if (leaving && event.target === event.currentTarget && event.propertyName === "transform") {
          dismissIntro();
        }
      }}
    >
      {/* Soft brand atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/3 h-[26rem] w-[26rem] rounded-full bg-mint/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-mango/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(127,175,45,0.16),transparent_60%)]"
      />

      <header className="relative z-10 flex items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.24em]">
        <span className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-mango shadow-[0_0_0_4px_rgba(254,178,18,0.2)]" />
          Vị Xoài Dẫn Lối
        </span>
        <span className="hidden text-forest/60 sm:block">
          Trạm Hẹn Cao Lãnh · 21.11.2026
        </span>
      </header>

      <div className="relative z-10 grid w-full max-w-6xl place-self-center items-center gap-8 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="flex flex-col items-start">
          <p className="inline-flex items-center gap-2 rounded-full border border-forest/20 bg-cream-soft/80 px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.3em] text-forest-mid">
            <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
            Cao Lãnh · Đồng Tháp
          </p>

          <h1 className="mt-5 font-display text-[clamp(2.6rem,5.6vw,5.4rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-forest">
            Theo vị xoài Cát,
            <br />
            <em className="font-normal italic text-earth">mở lối chu du.</em>
          </h1>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-forest/70 sm:text-[15px]">
            Từ vùng trồng xoài Cát Cao Lãnh, mở lối chu du qua miệt vườn, đời
            sống nhà vườn và những câu chuyện văn hóa Đồng Tháp. Cuộn để bắt đầu
            hành trình.
          </p>

          <div className="mt-8 w-full max-w-sm">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-forest/10">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-mango to-mango-bright transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.22em] text-forest/50">
              <span>{ready ? "Bản đồ đã sẵn sàng" : "Đang chuẩn bị bản đồ"}</span>
              <span>{progress}%</span>
            </div>
          </div>

          <p
            className={`mt-7 inline-flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.26em] transition-colors duration-500 ${
              ready ? "text-forest" : "text-forest/50"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mango opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mango" />
            </span>
            {ready ? "Đang mở lối vào Cao Lãnh" : "Đang tải ảnh vệ tinh"}
          </p>
        </div>

        <div className="relative hidden lg:block">
          <div className="relative aspect-square overflow-hidden rounded-[2.25rem] border border-forest/10 shadow-brand">
            <Image
              src="/76cb5fbe-2b41-4e96-a4ee-00344fc4e9f2.jpg"
              alt="Minh họa Vị Xoài Dẫn Lối — thuyền xoài trên sông miệt vườn"
              fill
              priority
              sizes="(min-width: 1024px) 44vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="absolute -right-3 -top-4 rotate-3 rounded-2xl bg-mango px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-forest shadow-card">
            21.11.2026
          </div>

          <div className="absolute -bottom-5 left-5 max-w-[15rem] rounded-2xl border border-forest/10 bg-cream-soft/95 px-5 py-4 shadow-card backdrop-blur">
            <p className="font-display text-base font-semibold leading-tight text-forest">
              Một vé chu du
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-forest/60">
              Muôn điều khám phá
            </p>
          </div>
        </div>
      </div>

      <footer className="relative z-10 flex items-center justify-between gap-4 text-[8px] font-medium uppercase tracking-[0.16em] text-forest/40">
        <span>Trạm Hẹn Cao Lãnh · TP. Hồ Chí Minh</span>
        <span className="hidden sm:block">
          Satellite © Esri · Terrain © Mapzen/AWS · Data © OpenStreetMap
        </span>
      </footer>
    </section>
  );
}
