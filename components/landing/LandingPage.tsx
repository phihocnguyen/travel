
"use client";

import Image from "next/image";
import PhotoLibrary from "@/components/photos/PhotoLibrary";
import { PHOTO_FEATURES } from "@/lib/photos";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowDown,
  MapPin,
  Compass,
  Menu,
} from "lucide-react";
import { EVENT } from "@/components/campaign/campaignData";
import HeaderAccount from "@/components/auth/HeaderAccount";
import HeroVideo from "./HeroVideo";
import { setupLandingButtons, setupLandingReveals } from "./landingMotion";
import "./landing-motion.css";

const destinations = [
 {number:"01",title:"Khu di tích Xẻo Quýt",category:"THIÊN NHIÊN & LỊCH SỬ",location:"Cao Lãnh",image:PHOTO_FEATURES.xeoQuyt.src,description:"Theo lạch nước xanh, nghe rừng tràm kể chuyện."},
 {number:"02",title:"Sinh thái Gáo Giồng",category:"THIÊN NHIÊN",location:"Cao Lãnh",image:PHOTO_FEATURES.gaoGiong.src,description:"Một chuyến xuồng giữa những tán tràm xanh."},
 {number:"03",title:"Mỹ Phước Thành",category:"TRẢI NGHIỆM ĐỒNG QUÊ",location:"Cao Lãnh",image:PHOTO_FEATURES.myPhuocThanh.src,description:"Ghé miền đồng xanh, tìm một khoảng bình yên."},
 {number:"04",title:"Chợ quê Tân Thuận Đông",category:"VĂN HÓA & CỘNG ĐỒNG",location:"Cù lao Tân Thuận Đông",image:PHOTO_FEATURES.market.src,description:"Gặp những con người thân thương bên mái lá."},
];

function SplitTitle({
  lines,
  className = "",
}: {
  lines: { text: string; italic?: boolean }[];
  className?: string;
}) {
  return (
    <h2 className={className}>
      {lines.map((line, index) => (
        <span
          key={index}
          className="block overflow-hidden pb-[0.12em] -mb-[0.12em]"
        >
          <span
            data-split-line
            className={`block w-fit ${
              line.italic
                ? "italic font-normal"
                : "font-bold"
            }`}
          >
            {line.text}
          </span>
        </span>
      ))}
    </h2>
  );
}

function JourneyCard({
  destination,
}: {
  destination: (typeof destinations)[number];
}) {
  return (
    <article
      data-destination
      className="group relative mx-auto w-full max-w-[420px]"
    >
      <div className="relative overflow-hidden rounded-[24px] bg-[#d7dfd2] sm:rounded-[32px]">
        <div
          className="relative aspect-video overflow-hidden"
        >
          <Image
            fill
            quality={85}
            sizes="(max-width: 640px) 90vw, 420px"
            data-destination-image
            src={destination.image}
            alt={destination.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#102820]/75 via-transparent to-transparent" />

          <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/40 bg-[#14342a]/75 px-4 py-2 text-[11px] font-semibold text-white">
            <MapPin size={12} />
            {destination.location}
          </div>

          <div className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#173b2f] transition-all duration-500 group-hover:rotate-45 group-hover:bg-[#f2d06a]">
            <ArrowUpRight size={20} />
          </div>

          <div className="absolute bottom-5 left-5 right-5 text-white">
            <p className="mb-2 text-[9px] font-bold tracking-[.15em] text-[#f3d581]">
              {destination.category} / {destination.number}
            </p>

            <h3 className="text-[clamp(20px,2.2vw,28px)] font-semibold tracking-[-.055em]">
              {destination.title}
            </h3>

            <p className="mt-2 max-w-sm text-xs leading-5 text-white/85">
              {destination.description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function LandingPage() {
  const root = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("#hero");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let previous = false;
    const update = () => {
      const next = window.scrollY > (previous ? 8 : 48);
      if (next !== previous) {
        previous = next;
        setScrolled(next);
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const sections = ["hero", "story", "destinations", "photos", "cta"];
    let observer: IntersectionObserver;
    // Track the navigation marker without measuring every section on every frame.
    const observe = () => {
      observer?.disconnect();
      const marker = Math.round(window.innerHeight * 0.38);
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(`#${entry.target.id}`);
        }
      }, { rootMargin: `-${marker}px 0px -${Math.max(0, window.innerHeight - marker - 1)}px 0px` });
      for (const id of sections) {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
      }
    };
    observe();
    window.addEventListener("resize", observe, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", observe);
    };
  }, []);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const cleanupReveals = setupLandingReveals(el, reducedMotion);
    const cleanupButtons = setupLandingButtons(el, reducedMotion);
    let scrollFrame = 0;
    const cancelScroll = () => {
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    };
    const scrollToSection = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      cancelScroll();
      history.replaceState(null, "", link.hash);
      const top = target.id === "hero" ? 0 : target.getBoundingClientRect().top + window.scrollY - 84;
      const from = window.scrollY;
      const destination = Math.max(0, Math.min(top, document.documentElement.scrollHeight - window.innerHeight));
      const distance = destination - from;
      if(reducedMotion){window.scrollTo({top:destination,behavior:"instant"});return;}
      const duration = Math.min(900, Math.max(450, Math.abs(distance) * 0.2));
      const started = performance.now();
      // Animate only during a menu click; OS/CSS smooth-scroll settings cannot turn it into a jump.
      const step = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        window.scrollTo({ top: from + distance * eased, behavior: "instant" });
        scrollFrame = progress < 1 ? window.requestAnimationFrame(step) : 0;
      };
      scrollFrame = window.requestAnimationFrame(step);
    };
    el.addEventListener("click", scrollToSection);
    window.addEventListener("wheel", cancelScroll, { passive: true });
    window.addEventListener("touchstart", cancelScroll, { passive: true });
    window.addEventListener("keydown", cancelScroll);
    return () => {
      cancelScroll();
      cleanupReveals();
      cleanupButtons();
      el.removeEventListener("click", scrollToSection);
      window.removeEventListener("wheel", cancelScroll);
      window.removeEventListener("touchstart", cancelScroll);
      window.removeEventListener("keydown", cancelScroll);
    };
  }, [reducedMotion]);


  return (
    <main
      ref={root}
      data-landing-motion={reducedMotion ? "reduced" : "full"}
      className="landing-page overflow-x-clip bg-[#f8f9f5] text-[#14342a]"
    >
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
        }

        .font-display {
          font-family: var(--font-display);
        }

        .font-script {
          font-family:
            "Palatino Linotype",
            "Book Antiqua",
            "Times New Roman",
            serif;
        }

        .hero-title {
          text-shadow: 0 2px 28px rgba(13, 58, 75, 0.1);
        }

        .glass-panel {
          background: rgba(255, 255, 255, 0.92);
          box-shadow:
            0 30px 85px rgba(17, 61, 69, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

          .landing-page[data-landing-motion="reduced"] *,
          .landing-page[data-landing-motion="reduced"] *::before,
          .landing-page[data-landing-motion="reduced"] *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }

        .landing-nav,
        .landing-nav .nav-color,
        .landing-nav [data-nav-item] a {
          transition-duration: 650ms !important;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>

      {/* ================================================
          HERO — NUSANTARA INSPIRED
      ================================================= */}
      <section
        id="hero"
        className="relative flex h-svh w-full flex-col overflow-hidden bg-[#6aafd9] text-white"
      >
        {/* BACKGROUND */}
        <div className="absolute inset-0">
          <HeroVideo poster={PHOTO_FEATURES.harvest.src} />

          <div className="absolute inset-0 bg-gradient-to-r from-[#064d70]/55 via-[#246991]/25 to-[#0c4666]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#072e34]/45 via-transparent to-[#0c4666]/20" />
        </div>

        {/* NAVIGATION */}
        <header data-site-header className={`landing-nav fixed left-1/2 top-0 z-[100] isolate flex items-center justify-between gap-8 transition-[translate,width,padding,border-radius,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${scrolled ? "w-[calc(100%_-_1.5rem)] -translate-x-1/2 translate-y-3 rounded-xl px-4 py-3 text-[#14342a] sm:w-[calc(100%_-_3rem)] sm:translate-y-4 sm:px-6" : "w-full -translate-x-1/2 translate-y-0 rounded-none px-6 py-7 text-white sm:px-10 lg:px-16"}`}>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-white shadow-[0_4px_14px_rgba(20,52,42,0.08)] transition-opacity duration-300" style={{ opacity: scrolled ? 1 : 0 }} />
          <a
            data-nav-item
            href="#hero"
            aria-label="Vị Xoài Dẫn Lối · Trang chủ"
            className="flex items-center gap-3"
          >
            <span aria-hidden="true" className="h-11 w-11 shrink-0 rounded-md bg-[#f8f5df] sm:h-12 sm:w-12" style={{ backgroundImage: "url(/76cb5fbe-2b41-4e96-a4ee-00344fc4e9f2.jpg)", backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
            <span className="hidden text-sm font-semibold leading-tight sm:block">Vị Xoài Dẫn Lối<span className={`nav-color mt-1 block text-[10px] font-normal transition-colors ${scrolled ? "text-[#657361]" : "text-white/75"}`}>Cao Lãnh · Đồng Tháp</span></span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex xl:gap-10">
            {[
              ["Trang chủ", "#hero"],
              ["Câu chuyện", "#story"],
              ["Điểm đến", "#destinations"],
              ["Ảnh thật", "#photos"],
              ["Sự kiện", "#cta"],
            ].map(([name, href]) => (
              <a
                key={name}
                data-nav-item
                href={href}
                aria-current={activeSection === href ? "location" : undefined}
                className={`nav-color relative text-[12px] font-bold transition-colors ${activeSection === href ? `${scrolled ? "text-[#9a6818]" : "text-[#ffe294]"} after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-[#d7a83e]` : scrolled ? "text-[#14342a]/85 hover:text-[#b48325]" : "text-white/85 hover:text-[#ffe294]"}`}
              >
                {name}
              </a>
            ))}
          </nav>

          <div data-nav-item className="flex items-center gap-3 [&_a]:transition-colors [&_a]:duration-[650ms]">
            <button
              type="button"
              aria-label="Bật hiệu ứng chuyển động"
              aria-pressed={!reducedMotion}
              onClick={() => setReducedMotion(value => !value)}
              className="rounded-full border border-current/30 px-3 py-2 text-[10px] font-semibold"
            >
              Hiệu ứng: {reducedMotion ? "Tắt" : "Bật"}
            </button>
            <HeaderAccount dark={!scrolled} />
            <a
              href="/map"
              data-magnetic
              className={`nav-color hidden items-center gap-2 rounded-full border px-5 py-3 text-[11px] font-semibold transition-colors sm:inline-flex ${scrolled ? "border-[#14342a]/30 hover:bg-[#14342a] hover:text-white" : "border-white/65 hover:bg-white hover:text-[#155277]"}`}
            >
              Khám phá bản đồ
              <ArrowUpRight size={14} />
            </a>

            <a
              href="#destinations"
              aria-label="Khám phá điểm đến"
              className={`nav-color grid h-11 w-11 place-items-center rounded-full border transition-colors lg:hidden ${scrolled ? "border-[#14342a]/30" : "border-white/60"}`}
            >
              <Menu size={19} />
            </a>
          </div>
        </header>
        <div aria-hidden="true" className="h-[104px] shrink-0" />

        {/* HERO CONTENT */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1680px] min-h-0 flex-1 flex-col justify-center px-6 pb-12 pt-4 sm:px-10 lg:px-16 lg:pb-14 lg:pt-6">
          {/* Big headline */}
          <div
            data-hero-headline
            className="relative z-10 mt-4 max-w-[1000px] sm:mt-6"
          >
            <div
              data-hero-kicker
              className="mb-5 flex items-center gap-3"
            >
              <span className="h-2 w-2 rounded-full bg-[#ffdf84]" />
              <span className="text-[10px] font-bold uppercase tracking-[.25em] text-white/85">
                KHÁM PHÁ CAO LÃNH · ĐỒNG THÁP
              </span>
            </div>

            <h1 className="hero-title font-display text-[clamp(38px,6vw,90px)] font-black uppercase leading-[.99] tracking-[-.065em]">
              <span className="block overflow-hidden">
                <span data-hero-title className="block">
                  HƯƠNG VỊ
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-hero-title className="block">
                  CAO LÃNH
                </span>
              </span>
            </h1>

            <div className="mt-[-0.015em] overflow-hidden pb-4">
              <p
                data-hero-script
                className="font-script text-[clamp(38px,6.5vw,96px)] italic leading-[1.05] tracking-[-.075em] text-[#ffe1a0]"
              >
                Hành trình vị xoài
              </p>
            </div>

            <p
              data-hero-support
              className="mt-4 max-w-md text-sm leading-7 text-white/80 lg:hidden"
            >
              Khám phá miền đất sen hồng qua hương vị
              xoài Cát, những khu vườn và câu chuyện
              đậm chất miền Tây.
            </p>
          </div>

          {/* Bottom content, aligned like reference */}
          <div className="relative z-20 mt-5 grid items-end gap-5 lg:mt-5 ">
            <div className="max-w-[450px]">
              {/* Social proof / visual dots */}
              <div
                data-hero-support
                className="mb-3 hidden items-center gap-4 sm:flex [@media(max-height:700px)]:hidden"
              >
                <div className="flex -space-x-3">
                  {[
                    PHOTO_FEATURES.xeoQuyt.thumbnail,
                    PHOTO_FEATURES.farmer.thumbnail,
                    PHOTO_FEATURES.market.thumbnail,
                  ].map((image, i) => (
                    <div
                      key={i}
                      className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white"
                    >
                      <Image
                        fill
                        sizes="40px"
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}

                  <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-[#4c83e9] text-[10px] font-bold text-white">
                    04+
                  </div>
                </div>

                <p className="text-[11px] font-semibold leading-5 text-white">
                  Những điểm đến
                  <br />
                  đang chờ bạn khám phá
                </p>
              </div>

              <p
                data-hero-support
                className="hidden max-w-sm text-[13px] leading-[1.7] text-white/85 sm:block [@media(max-height:700px)]:hidden"
              >
                Từ những vườn xoài xanh mát đến nét
                văn hóa đặc trưng, mỗi điểm dừng là
                một câu chuyện khiến bạn muốn ở lại lâu hơn.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  data-hero-support
                  data-magnetic
                  href="/map"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#f0c85e] px-6 py-3 text-xs font-bold text-[#173b2f] shadow-[0_12px_35px_rgba(69,55,18,.2)] transition-colors hover:bg-[#ffdf84]"
                >
                  Khám phá bản đồ
                  <ArrowUpRight size={16} />
                </a>
                <a
                  data-hero-support
                  data-magnetic
                  href="/explore"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-white/80 bg-white/15 px-6 py-3 text-xs font-bold text-white shadow-[0_12px_35px_rgba(8,36,32,.2)] transition-colors hover:bg-white hover:text-[#173b2f]"
                >
                  Chơi game Cao Lãnh
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>


          </div>

          {/* Bottom navigation line */}
          <div
            data-hero-bottom
            className="mt-5 hidden items-center justify-between border-t border-white/30 pt-4 text-[10px] font-semibold uppercase tracking-[.2em] text-white/70 sm:flex [@media(max-height:700px)]:hidden"
          >
            <span>10°27′ N · 105°38′ E</span>
            <a
              href="#story"
              className="flex items-center gap-3 hover:text-white"
            >
              Cuộn xuống để khám phá
              <ArrowDown size={15} />
            </a>
            <span className="hidden sm:block">
              Đồng Tháp · Việt Nam
            </span>
          </div>
        </div>
      </section>

      {/* ================================================
          STORY — LIGHT EDITORIAL
      ================================================= */}
      <section
        id="story"
        className="relative overflow-hidden bg-[#f8f9f5] px-6 py-28 sm:px-10 lg:px-16 lg:py-44"
      >
        <div className="mx-auto grid max-w-[1480px] items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <div
              data-fade-up
              className="mb-8 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.24em] text-[#5577a6]"
            >
              <span className="h-2 w-2 rounded-full bg-[#e3b94d]" />
              01 / Câu chuyện
            </div>

            <div data-section-heading>
              <SplitTitle
                className="font-display text-[clamp(38px,4.8vw,70px)] leading-[.99] tracking-[-.065em]"
                lines={[
                  { text: "Một trái ngọt" },
                  { text: "Ngàn", italic: true },
                  { text: "câu chuyện" },
                ]}
              />
            </div>

            <p
              data-fade-up
              className="mt-9 max-w-lg text-base leading-9 text-[#75837c]"
            >
              Một trái xoài Cát không chỉ mang theo vị ngọt,
              mà còn kể câu chuyện về con người, đất đai,
              và nhịp sống hiền hòa của Cao Lãnh.
              Từ vườn cây đến từng điểm dừng,
              hãy khám phá miền Tây theo cách của riêng bạn.
            </p>

            <a
              data-fade-up
              data-magnetic
              href="/map"
              className="mt-10 inline-flex items-center gap-6 rounded-full bg-[#f0c85e] px-7 py-4 text-xs font-bold text-[#173b2f] transition-colors hover:bg-[#ffdf84]"
            >
              Khám phá câu chuyện
              <ArrowUpRight size={17} />
            </a>
          </div>

          <div className="relative mx-auto w-full max-w-[600px]">
            <div
              data-image-frame
              className="relative aspect-video overflow-hidden rounded-[24px] bg-[#d3dfcc]"
            >
              <Image
                fill
                quality={85}
                sizes="(max-width: 1024px) 90vw, 600px"
                data-story-image
                src={PHOTO_FEATURES.farmer.src}
                alt={PHOTO_FEATURES.farmer.alt}
                className="object-cover"
              />
            </div>

            <div
              data-fade-up
              className="absolute -bottom-8 -left-4 rounded-2xl bg-[#f0c85e] px-7 py-6 shadow-xl sm:-left-10"
            >
              <p className="font-script text-3xl italic text-[#183e31]">
                Kết tinh từ thiên nhiên
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#36614b]">
                CAO LÃNH · ĐỒNG THÁP
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          DESTINATIONS
      ================================================= */}
      <section
        id="destinations"
        className="overflow-hidden bg-[#eaf0ed] px-6 py-28 sm:px-10 lg:px-16 lg:py-40"
      >
        <div className="mx-auto max-w-[1480px]">
          <div className="mb-20 flex flex-wrap items-end justify-between gap-10">
            <div>
              <p
                data-fade-up
                className="mb-7 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.24em] text-[#56759a]"
              >
                <span className="h-2 w-2 rounded-full bg-[#e5b94e]" />
                02 / Khám phá miền Tây
              </p>

              <div data-section-heading>
                <SplitTitle
                  className="font-display text-[clamp(38px,5vw,72px)] leading-[.98] tracking-[-.065em]"
                  lines={[
                    { text: "Mỗi điểm đến," },
                    { text: "một cảm xúc mới", italic: true },
                  ]}
                />
              </div>
            </div>

            <p
              data-fade-up
              className="max-w-xs text-sm leading-8 text-[#78877f]"
            >
              Những điểm đến thân thương, nơi bạn
              có thể sống chậm lại và cảm nhận
              những điều bình dị.
            </p>
          </div>

          <div className="mx-auto grid max-w-[900px] gap-10 sm:grid-cols-2 lg:gap-12">
            {destinations.map((destination) => (
              <JourneyCard
                key={destination.number}
                destination={destination}
              />
            ))}
          </div>

          <div
            data-fade-up
            className="mt-16 flex justify-center lg:mt-20"
          >
            <a
              href="/map"
              data-magnetic
              className="inline-flex items-center gap-5 rounded-full bg-[#f0c85e] px-8 py-5 text-xs font-bold text-[#173b2f] transition-colors hover:bg-[#ffdf84]"
            >
              Xem tất cả trên bản đồ
              <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
      </section>

      <PhotoLibrary />

      {/* ================================================
          CTA — EXPERIENCE
      ================================================= */}
      <section
        id="cta"
        className="relative overflow-hidden bg-[#bed8e6] px-6 py-28 sm:px-10 lg:px-16 lg:py-44"
      >
        <div
          data-cta-orb
          className="pointer-events-none absolute -right-40 -top-56 h-[650px] w-[650px] rounded-full bg-[radial-gradient(ellipse,rgba(243,213,116,0.7),transparent_70%)]"
        />
        <div className="pointer-events-none absolute -bottom-64 -left-48 h-[600px] w-[600px] rounded-full bg-[radial-gradient(ellipse,rgba(118,174,214,0.6),transparent_70%)]" />

        <div className="relative mx-auto max-w-[1100px] text-center">
          <p
            data-fade-up
            className="mb-9 text-[11px] font-bold uppercase tracking-[.3em] text-[#376782]"
          >
            03 / CHUYẾN ĐI TIẾP THEO
          </p>

          <div data-section-heading>
            <SplitTitle
              className="font-display text-[clamp(42px,6vw,86px)] leading-[1.25] tracking-[-.035em] text-[#163d43] [&>span+span]:mt-2 [&_[data-split-line]]:mx-auto"
              lines={[
                { text: "Hẹn gặp ở" },
                { text: "Cao Lãnh", italic: true },
              ]}
            />
          </div>

          <p
            data-fade-up
            className="mx-auto mt-10 max-w-xl text-base leading-8 text-[#50747b]"
          >
            {EVENT.description}
          </p>

          <div
            data-fade-up
            className="mt-9 flex flex-wrap justify-center gap-4"
          >
            {EVENT.meta.map((item) => (
              <span
                key={item.label}
                className="rounded-full border border-[#376782]/20 bg-white/70 px-5 py-3 text-[11px] font-semibold text-[#325f6c]"
              >
                {item.label}: {item.value}
              </span>
            ))}
          </div>

          <div
            data-fade-up
            className="mt-12 flex flex-wrap justify-center gap-4"
          >
            <a
              href={EVENT.ticketHref}
              data-magnetic
              className="inline-flex min-h-16 items-center gap-7 rounded-full bg-[#f0c85e] px-9 text-xs font-bold text-[#173b2f] shadow-[0_15px_40px_rgba(69,55,18,.2)] transition-colors hover:bg-[#ffdf84]"
            >
              Tạo vé hẹn chu du
              <ArrowUpRight size={18} />
            </a>

            <a
              href="/map"
              data-magnetic
              className="inline-flex min-h-16 items-center gap-7 rounded-full border border-[#235362]/30 bg-white/50 px-9 text-xs font-bold text-[#214c59] transition-colors hover:bg-white"
            >
              Khám phá bản đồ
              <Compass size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ================================================
          FOOTER
      ================================================= */}
      <footer className="bg-[#112e2b] px-6 pb-9 pt-20 text-white sm:px-10 lg:px-16">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-wrap items-end justify-between gap-10 border-b border-white/20 pb-16">
            <div>
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[.25em] text-[#a9c5b7]">
                HÀNH TRÌNH VỊ XOÀI
              </p>
              <h2 className="font-display text-[clamp(38px,5vw,72px)] font-bold tracking-[-.07em]">
                Cao Lãnh
              </h2>
            </div>

          </div>

          <div className="mt-8 flex flex-wrap justify-between gap-5 text-[10px] font-semibold uppercase tracking-[.16em] text-white/50">
            <span>© 2026 Hành trình Cao Lãnh</span>
            <span>Đồng Tháp, Việt Nam</span>
            <span>Dành cho miền Tây</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
