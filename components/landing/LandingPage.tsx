"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CAMPAIGN, EVENT } from "@/components/campaign/campaignData";

const LOGO = "/76cb5fbe-2b41-4e96-a4ee-00344fc4e9f2.jpg";

type Tone = "cream" | "forest" | "mango";

type Slide = {
  id: string;
  tone: Tone;
  eyebrow: string;
  title: string;
  emphasis: string;
  body: string;
  bullets?: readonly string[];
  meta?: readonly { label: string; value: string }[];
  visual: "logo" | "date" | "experiences" | "ticket";
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
};

const TONE = {
  cream: {
    section: "bg-cream text-forest",
    eyebrow: "text-forest-mid",
    emphasis: "text-earth",
    body: "text-forest/70",
    chip: "bg-mint/40 text-forest",
    accent: "bg-mango",
    line: "border-forest/20",
    button: "bg-forest text-cream hover:bg-forest-mid",
    ghost: "border-forest/25 text-forest hover:bg-mint/30",
    muted: "text-forest/50",
  },
  forest: {
    section: "bg-forest text-cream",
    eyebrow: "text-mint",
    emphasis: "text-mango",
    body: "text-cream/75",
    chip: "bg-cream/10 text-cream",
    accent: "bg-mango",
    line: "border-cream/20",
    button: "bg-mango text-forest hover:bg-mango-bright",
    ghost: "border-cream/30 text-cream hover:bg-cream/10",
    muted: "text-cream/60",
  },
  mango: {
    section: "bg-mango text-forest",
    eyebrow: "text-forest/70",
    emphasis: "text-earth",
    body: "text-forest/80",
    chip: "bg-cream/50 text-forest",
    accent: "bg-forest",
    line: "border-forest/20",
    button: "bg-forest text-cream hover:bg-forest-mid",
    ghost: "border-forest/30 text-forest hover:bg-cream/30",
    muted: "text-forest/60",
  },
} as const;

const SLIDES: Slide[] = [
  {
    id: "chien-dich",
    tone: "cream",
    eyebrow: "Chiến dịch du lịch trải nghiệm · Cao Lãnh, Đồng Tháp",
    title: "Theo vị xoài Cát,",
    emphasis: "mở lối chu du.",
    body: CAMPAIGN.description,
    meta: [
      { label: "Dành cho", value: "Người trẻ 18–24 tuổi" },
      { label: "Khởi hành từ", value: "TP. Hồ Chí Minh" },
    ],
    visual: "logo",
    cta: { label: "Khám phá bản đồ", href: "/map" },
    secondary: { label: "Nhận Vé Hẹn", href: "/dashboard/tickets/new" },
  },
  {
    id: "su-kien",
    tone: "forest",
    eyebrow: "Sự kiện trải nghiệm · Trạm Hẹn Cao Lãnh",
    title: "Một vé chu du,",
    emphasis: "muôn điều khám phá.",
    body: EVENT.description,
    meta: EVENT.meta,
    visual: "date",
    cta: { label: "Tạo Vé Hẹn Chu Du", href: "/dashboard/tickets/new" },
    secondary: { label: "Xem bản đồ", href: "/map" },
  },
  {
    id: "trai-nghiem",
    tone: "mango",
    eyebrow: "Tại Trạm Hẹn, bạn sẽ được",
    title: "Chạm vào",
    emphasis: "miệt vườn xoài.",
    body: "Bốn trạm tương tác đưa bạn đi từ chuyến đi, vườn xoài, ẩm thực đến những phần quà mang dấu ấn Cao Lãnh.",
    bullets: EVENT.highlights,
    visual: "experiences",
    cta: { label: "Bắt đầu khám phá", href: "/map" },
  },
  {
    id: "khoi-hanh",
    tone: "cream",
    eyebrow: EVENT.ctaTitle,
    title: "Hẹn bạn",
    emphasis: "ở Cao Lãnh.",
    body: EVENT.ctaBody,
    meta: EVENT.meta,
    visual: "ticket",
    cta: { label: "Tạo Vé Hẹn Chu Du", href: "/dashboard/tickets/new" },
    secondary: { label: "Đăng nhập", href: "/login" },
  },
];

const PILLARS = [
  {
    index: "01",
    title: "Cảnh quan miệt vườn",
    copy: "Những vườn xoài Cát trĩu quả, con kênh xanh và nhịp sống chậm của đồng bằng.",
  },
  {
    index: "02",
    title: "Đời sống nhà vườn",
    copy: "Gặp gỡ người trồng xoài, nghe chuyện mùa vụ và cách một trái xoài lớn lên.",
  },
  {
    index: "03",
    title: "Văn hóa địa phương",
    copy: "Ẩm thực, làng nghề và những câu chuyện làm nên bản sắc Cao Lãnh hôm nay.",
  },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src={LOGO}
      alt="Vị Xoài Dẫn Lối"
      width={1252}
      height={1252}
      priority
      className={className}
    />
  );
}

function SlideVisual({ slide }: { slide: Slide }) {
  if (slide.visual === "logo") {
    return (
      <div className="relative flex items-center justify-center">
        <Logo className="w-full max-w-[30rem] select-none object-contain mix-blend-multiply" />
      </div>
    );
  }

  if (slide.visual === "date") {
    return (
      <div className="relative flex flex-col items-start justify-center lg:items-center">
        <span className="font-display text-[clamp(4.5rem,10vw,9rem)] leading-none tracking-[-0.04em] text-mango">
          21.11
        </span>
        <span className="mt-2 text-sm font-semibold uppercase tracking-[0.32em] text-cream/70">
          TP. Hồ Chí Minh
        </span>
        <span className="mt-6 h-px w-24 bg-cream/25" />
        <span className="mt-6 max-w-xs text-sm leading-relaxed text-cream/70">
          Một ngày để đi qua bốn trạm trải nghiệm, tích Điểm Vườn và mang về
          những phần quà của miệt vườn.
        </span>
      </div>
    );
  }

  if (slide.visual === "experiences") {
    return (
      <div className="grid grid-cols-2 gap-x-5 gap-y-7">
        {[
          { icon: "🧭", label: "Di chuyển & lưu trú" },
          { icon: "🥭", label: "Vườn xoài" },
          { icon: "🍽️", label: "Ẩm thực địa phương" },
          { icon: "🎁", label: "Trò chơi & quà tặng" },
        ].map((item) => (
          <div key={item.label}>
            <span className="text-3xl" aria-hidden>
              {item.icon}
            </span>
            <p className="mt-2 text-[13px] font-semibold leading-tight text-forest">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute h-64 w-64 rounded-full bg-mint/30 blur-2xl" aria-hidden />
      <div className="relative flex h-56 w-56 flex-col items-center justify-center rounded-full bg-forest text-center text-cream">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-mint">
          Vé Hẹn
        </span>
        <span className="mt-2 font-display text-4xl leading-none">Chu Du</span>
        <span className="mt-3 text-[9px] font-semibold uppercase tracking-[0.24em] text-cream/60">
          Cao Lãnh · 2026
        </span>
      </div>
      <span className="absolute -right-2 top-6 rotate-6 rounded-full bg-mango px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-forest">21.11</span>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-forest/10 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Vị Xoài Dẫn Lối — trang chủ">
          <span className="relative block h-11 w-11">
            <Logo className="h-full w-full object-contain mix-blend-multiply" />
          </span>
          <span className="font-display text-[13px] leading-[0.95] tracking-tight text-forest sm:text-sm">
            Vị Xoài
            <br />
            Dẫn Lối
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] md:flex" aria-label="Điều hướng chính">
          <a href="#gioi-thieu" className="rounded-full px-4 py-2 text-forest/70 transition-colors hover:bg-mint/30 hover:text-forest">
            Giới thiệu
          </a>
          <a href="#tram-hen" className="rounded-full px-4 py-2 text-forest/70 transition-colors hover:bg-mint/30 hover:text-forest">
            Trạm Hẹn
          </a>
          <Link href="/map" className="rounded-full px-4 py-2 text-forest/70 transition-colors hover:bg-mint/30 hover:text-forest">
            Bản đồ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/map"
            className="rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-forest/70 transition-colors hover:text-forest md:hidden"
          >
            Bản đồ
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-forest px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cream transition-colors hover:bg-forest-mid"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    </header>
  );
}

function Carousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const count = SLIDES.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  return (
    <section
      className="relative overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Giới thiệu Vị Xoài Dẫn Lối"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(index - 1);
        if (event.key === "ArrowRight") go(index + 1);
      }}
      tabIndex={0}
    >
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onPointerDown={(event) => {
          pointerStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (pointerStart.current == null) return;
          const delta = event.clientX - pointerStart.current;
          pointerStart.current = null;
          if (Math.abs(delta) > 48) go(index + (delta < 0 ? 1 : -1));
        }}
        onPointerCancel={() => {
          pointerStart.current = null;
        }}
      >
        {SLIDES.map((slide, slideIndex) => {
          const tone = TONE[slide.tone];
          return (
            <article
              key={slide.id}
              className={`flex min-h-[calc(100dvh-4rem)] w-full shrink-0 items-center px-5 pb-24 pt-10 sm:px-8 lg:px-12 ${tone.section}`}
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} / ${count}: ${slide.title} ${slide.emphasis}`}
              aria-hidden={slideIndex !== index}
              inert={slideIndex !== index}
            >
              <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                <div className={slide.visual === "logo" ? "lg:order-2" : ""}>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.24em] ${tone.chip}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${tone.accent}`} />
                    {slide.eyebrow}
                  </div>

                  <h1 className="mt-5 font-display text-[clamp(2.8rem,6vw,5.8rem)] leading-[0.95] tracking-[-0.03em]">
                    {slide.title}
                    <br />
                    <span className={tone.emphasis}>{slide.emphasis}</span>
                  </h1>

                  <p className={`mt-5 max-w-xl text-sm leading-relaxed sm:text-[15px] ${tone.body}`}>
                    {slide.body}
                  </p>

                  {slide.bullets && (
                    <ul className="mt-6 grid max-w-xl gap-2.5">
                      {slide.bullets.map((item) => (
                        <li key={item} className={`flex items-start gap-3 text-[13px] leading-relaxed ${tone.body}`}>
                          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone.accent}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {slide.meta && (
                    <dl className={`mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t pt-5 ${tone.line}`}>
                      {slide.meta.map((item) => (
                        <div key={item.label}>
                          <dt className={`text-[8px] font-bold uppercase tracking-[0.24em] ${tone.muted}`}>
                            {item.label}
                          </dt>
                          <dd className="mt-1 font-display text-base">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <div className="mt-7 flex flex-wrap gap-2.5">
                    <Link
                      href={slide.cta.href}
                      className={`inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${tone.button}`}
                    >
                      {slide.cta.label}
                      <span aria-hidden>↗</span>
                    </Link>
                    {slide.secondary && (
                      <Link
                        href={slide.secondary.href}
                        className={`inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${tone.ghost}`}
                      >
                        {slide.secondary.label}
                      </Link>
                    )}
                  </div>
                </div>

                <div className={slide.visual === "logo" ? "lg:order-1" : ""}>
                  <SlideVisual slide={slide} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
        <div className="pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 pb-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-2" role="tablist" aria-label="Chọn slide">
            {SLIDES.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={slideIndex === index}
                aria-label={`Slide ${slideIndex + 1}: ${slide.title} ${slide.emphasis}`}
                onClick={() => go(slideIndex)}
                className={`h-1.5 rounded-full transition-all ${
                  slideIndex === index ? "w-8 bg-forest" : "w-3 bg-forest/25 hover:bg-forest/40"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-forest/50">
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="Slide trước"
                className="grid h-10 w-10 place-items-center rounded-full border border-forest/20 bg-cream/80 text-forest transition-colors hover:bg-forest hover:text-cream"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="Slide tiếp theo"
                className="grid h-10 w-10 place-items-center rounded-full border border-forest/20 bg-cream/80 text-forest transition-colors hover:bg-forest hover:text-cream"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionIntro() {
  return (
    <section id="gioi-thieu" className="bg-cream px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.26em] text-forest-mid">
              <span className="h-px w-7 bg-mango" />
              Về chiến dịch
            </p>
            <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.6rem)] leading-[1.02] tracking-[-0.02em] text-forest">
              Một vị xoài,
              <br />
              mở ra cả <span className="text-earth">miền Tây.</span>
            </h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-[15px] leading-relaxed text-forest/70">
              {CAMPAIGN.description}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-forest/70">
              Vị Xoài Dẫn Lối mời bạn bước ra khỏi thành phố, đi theo mùa xoài
              chín và dừng lại ở những điều bình dị nhất của Cao Lãnh.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-8 border-t border-forest/20 pt-10 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.index}>
              <span className="font-display text-sm text-mango">{pillar.index}</span>
              <h3 className="mt-2 font-display text-xl text-forest">{pillar.title}</h3>
              <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-forest/70">
                {pillar.copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionEvent() {
  return (
    <section id="tram-hen" className="bg-forest px-5 py-20 text-cream sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <p className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.26em] text-mint">
              <span className="h-px w-7 bg-mango" />
              {EVENT.name}
            </p>
            <h2 className="mt-4 font-display text-[clamp(2.4rem,4.6vw,4.4rem)] leading-[0.98] tracking-[-0.02em]">
              Một vé chu du,
              <br />
              <span className="text-mango">muôn điều khám phá.</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-cream/75">
              {EVENT.description}
            </p>

            <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-6 border-t border-cream/20 pt-6">
              {EVENT.meta.map((item) => (
                <div key={item.label}>
                  <dt className="text-[8px] font-bold uppercase tracking-[0.24em] text-cream/50">
                    {item.label}
                  </dt>
                  <dd className="mt-1 font-display text-lg text-cream">{item.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link
                href={EVENT.ticketHref}
                className="inline-flex items-center gap-2 rounded-full bg-mango px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-forest transition-colors hover:bg-mango-bright"
              >
                Tạo Vé Hẹn Chu Du
                <span aria-hidden>↗</span>
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center gap-2 rounded-full border border-cream/30 px-6 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cream transition-colors hover:bg-cream/10"
              >
                Mở bản đồ
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-mint">
              Tại đây, bạn sẽ được
            </p>
            <ul className="mt-4 divide-y divide-cream/20 border-y border-cream/20">
              {EVENT.highlights.map((item, i) => (
                <li key={item} className="flex items-start gap-4 py-4">
                  <span className="font-display text-sm text-mango">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] leading-relaxed text-cream/80">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[11px] italic leading-relaxed text-cream/50">
              {EVENT.ticketNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionMap() {
  return (
    <section id="ban-do" className="bg-cream px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 border-t border-forest/20 pt-12 sm:flex-row sm:items-end">
        <div>
          <p className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.26em] text-forest-mid">
            <span className="h-px w-7 bg-mango" />
            Tab bản đồ
          </p>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.02] tracking-[-0.02em] text-forest">
            Đi theo vị xoài
            <br />
            trên bản đồ tương tác.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-forest/70">
            Xoay, phóng to và chọn từng điểm đến để nghe câu chuyện của miệt
            vườn, dòng sông và những trạm dừng trên hành trình.
          </p>
        </div>
        <Link
          href="/map"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-forest px-7 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-cream transition-colors hover:bg-forest-mid"
        >
          Mở bản đồ
          <span aria-hidden>↗</span>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-cream-soft px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-forest/10 pt-6 text-[10px] font-medium uppercase tracking-[0.16em] text-forest/50 sm:flex-row sm:items-center sm:justify-between">
        <span>Vị Xoài Dẫn Lối · Trạm Hẹn Cao Lãnh</span>
        <div className="flex flex-wrap items-center gap-4">
          <a href="#gioi-thieu" className="hover:text-forest">Giới thiệu</a>
          <a href="#tram-hen" className="hover:text-forest">Trạm Hẹn</a>
          <Link href="/map" className="hover:text-forest">Bản đồ</Link>
          <Link href="/login" className="hover:text-forest">Đăng nhập</Link>
        </div>
        <span>Cao Lãnh · Đồng Tháp · 2026</span>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-cream">
      <Header />
      <main>
        <Carousel />
        <SectionIntro />
        <SectionEvent />
        <SectionMap />
      </main>
      <Footer />
    </div>
  );
}
