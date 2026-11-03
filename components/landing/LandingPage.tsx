"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Manrope, Playfair_Display } from "next/font/google";
import { EVENT } from "@/components/campaign/campaignData";

const sans = Manrope({ subsets: ["latin", "vietnamese"], variable: "--font-dm-sans", display: "swap" });
const serif = Playfair_Display({ subsets: ["latin", "vietnamese"], variable: "--font-editorial", display: "swap" });
const HERO_ART_IMAGE = "https://images.openai.com/static-rsc-4/nTBpwrJj7tdHKXwcDumzEIXVSo3IqlV6Lguyt9RWlpAnyzWXylQXbtxfTkfi2zx2cjZYJIImzJfD6_TTSPo-iPeEeP8e_sqcVtFi10Hy3WyzmrguCZAsVIfaKKB90u93TmQ92g1_NzSBl4gzA3QgAFV0N6i84Td7nl5RmA_cR4dfoJcR6OTb8M0Y-AdmXBbI?purpose=fullsize";

const projects = [
  { title: "The Taste of Mango", category: "MANGO ORCHARDS · CAO LANH", description: "Wander through lush orchards where golden mangoes ripen under the Mekong sun. Discover the flavour that defines Cao Lanh.", image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=1500&q=85" },
  { title: "Stories from the Orchard", category: "PEOPLE & HERITAGE", description: "Behind every harvest is a story. Meet the growers whose patience and traditions shape this remarkable land.", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1500&q=85" },
  { title: "Flavours of Home", category: "FOOD & CULTURE", description: "From orchard to table, explore the tastes, traditions and small pleasures that make the Mekong Delta unforgettable.", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1500&q=85" },
  { title: "The Cao Lanh Experience", category: "INTERACTIVE ADVENTURE", description: "Follow an interactive trail through local culture, unexpected encounters and memorable experiences.", image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1500&q=85" },
  { title: "Your Journey Pass", category: "YOUR JOURNEY", description: "Every discovery begins with a single step. Collect moments, follow hidden paths and make Cao Lanh part of your story.", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1500&q=85" },
];


export default function LandingPage() {
  const root = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [galleryFullscreen, setGalleryFullscreen] = useState(false);
  const cursorDot = useRef<HTMLDivElement>(null);
  const cursorRing = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    const started = Date.now();
    const hero = new Image();
    const finish = () => {
      const remaining = Math.max(0, 1350 - (Date.now() - started));
      window.setTimeout(() => {
        if (!active) return;
        const overlay = loaderRef.current;
        if (!overlay) { setLoading(false); return; }
        gsap.timeline({ onComplete: () => { if (active) setLoading(false); } })
          .to(overlay.querySelectorAll("[data-loader-content]"), { y: -36, autoAlpha: 0, duration: .55, stagger: .075, ease: "power3.inOut" })
          .to(overlay, { yPercent: -105, duration: 1.05, ease: "power4.inOut" }, "-=.15");
      }, remaining);
    };
    hero.onload = finish;
    hero.onerror = finish;
    hero.src = HERO_ART_IMAGE;
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const dot = cursorDot.current;
    const ring = cursorRing.current;
    if (!dot || !ring || !window.matchMedia("(pointer: fine)").matches) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    const setDotX = gsap.quickSetter(dot, "x", "px");
    const setDotY = gsap.quickSetter(dot, "y", "px");
    const setRingX = gsap.quickSetter(ring, "x", "px");
    const setRingY = gsap.quickSetter(ring, "y", "px");
    let positioned = false;
    const move = (e: PointerEvent) => {
      if (!positioned) {
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        positioned = true;
        root.current?.setAttribute("data-cursor-ready", "true");
      }
      setDotX(e.clientX); setDotY(e.clientY);
      setRingX(e.clientX); setRingY(e.clientY);
      gsap.to([dot, ring], { autoAlpha: 1, duration: reduceMotion ? 0 : .2, overwrite: "auto" });
      const target = e.target instanceof Element ? e.target : null;
      const interactive = !!target?.closest("a, button, [data-cursor-interactive]");
      gsap.to(ring, { scale: interactive ? 1.75 : 1, borderColor: interactive ? "#e1a735" : "#39754b", duration: reduceMotion ? 0 : .25, overwrite: "auto" });
      gsap.to(dot, { scale: interactive ? .5 : 1, duration: reduceMotion ? 0 : .25, overwrite: "auto" });
    };
    const leave = () => {
      root.current?.removeAttribute("data-cursor-ready");
      gsap.to([dot, ring], { autoAlpha: 0, duration: reduceMotion ? 0 : .2 });
    };
    const down = () => gsap.to(ring, { scale: .75, duration: reduceMotion ? 0 : .15 });
    const up = () => gsap.to(ring, { scale: 1, duration: reduceMotion ? 0 : .2 });
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      root.current?.removeAttribute("data-cursor-ready");
      gsap.killTweensOf([dot, ring]);
    };
  }, []);
  const navigation = useRef<((direction: -1 | 1) => void) | null>(null);
  const selectedRef = useRef(0);
  const switchingRef = useRef(false);
  useLayoutEffect(() => {
    if (!root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const rootEl = root.current;
    if (loading) return;
    const ctx = gsap.context(() => {
      // Keep the hero art in its resting position after the loader reveals it.
      gsap.set("[data-hero-float]", { y: 0, rotation: 0 });
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.to("[data-hero-orbit]", { rotation: 360, duration: 60, ease: "none", repeat: -1, paused: reduce });
      if (!reduce) gsap.to("[data-hero-float]", { y: -13, rotation: 1.5, duration: 4.5, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 2.4 });
      const stage = rootEl.querySelector<HTMLElement>("[data-stage]")!;
      const track = rootEl.querySelector<HTMLElement>("[data-track]")!;
      const cards = gsap.utils.toArray<HTMLElement>("[data-arc-card]", rootEl);
      const overlays = gsap.utils.toArray<HTMLElement>("[data-story-overlay]", rootEl);
      const galleryHeading = rootEl.querySelector<HTMLElement>("[data-gallery-heading]")!;
      const galleryScene = rootEl.querySelector<HTMLElement>("[data-gallery-scene]")!;
      const galleryHint = rootEl.querySelector<HTMLElement>("[data-gallery-hint]")!;
      const galleryBottomFade = rootEl.querySelector<HTMLElement>("[data-gallery-bottom-fade]")!;
      const nav = rootEl.querySelector<HTMLElement>("[data-gallery-nav]")!;
      const mainImage = cards[0].querySelector<HTMLElement>("img")!;
      const progress = rootEl.querySelector<HTMLElement>("[data-progress]")!;
      const vw = () => window.innerWidth;
      const vh = () => window.innerHeight;
      const mobile = () => vw() < 768;
      // Editorial scattered-gallery composition (Stillform-inspired).
      // Each card has a distinct, non-overlapping home position.
      const arc = (i: number) => {
        // Fixed slots: card 0 is always the center. The content rotates,
        // not the ScrollTrigger timeline, so navigation never re-pins the page.
        const positions = mobile()
          ? [[0, .04, 0], [.32, -.18, 6], [.32, .31, -5], [-.32, .31, 5], [-.32, -.18, -6]]
          : [[0, .04, 0], [.37, -.20, 6], [.35, .33, -5], [-.35, .33, 5], [-.37, -.20, -6]];
        const [px, py, rz] = positions[i];
        return {
          x: px * vw(), y: py * vh(), z: i === 0 ? 35 : -15,
          rotationY: i === 1 ? -7 : i === 4 ? 7 : 0,
          rotationZ: rz, scale: 1, zIndex: i === 0 ? 15 : 10
        };
      };
      // Focus images occupy the viewport at their actual size. Never scale a portrait
      // thumbnail to fill the screen (that caused huge images and clipping).
      gsap.set(galleryScene, { transformPerspective: 1450, transformStyle: "preserve-3d", z: 0, rotationY: 0 });
      gsap.set(cards, { xPercent: -50, yPercent: -50, transformOrigin: "50% 50%", force3D: true, backfaceVisibility: "hidden" });
      cards.forEach((card, i) => gsap.set(card, arc(i)));
      gsap.set(overlays, { autoAlpha: 0, y: 34 });
      gsap.set(galleryHint, { autoAlpha: 1 });
      gsap.set(nav, { autoAlpha: 0, pointerEvents: "none" });
      const story = gsap.timeline({
        defaults: { ease: "none" }, scrollTrigger: {
          trigger: stage, start: "top top",
          end: () => `+=${Math.round(vw() * 3 + vh() * 4.6)}`,
          pin: true, scrub: mobile() ? 0.85 : 1.45, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: self => {
            gsap.set(progress, { scaleX: self.progress });
            const t = story.time();
            const isFullscreen = t >= story.labels["zoom-0"] + 1.75 && t < story.labels["retreat-0"];
            setGalleryFullscreen(previous => previous === isFullscreen ? previous : isFullscreen);
          },
        }
      });
      story.to(track, { x: () => -vw(), duration: 1.4 });
      story.fromTo("[data-panel2-reveal]", { y: 55, autoAlpha: 0, filter: "blur(5px)" }, { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: .65, stagger: .09, ease: "power2.out" }, "<.72");
      story.to(track, { x: () => -vw() * 2, duration: 1.4 });
      story.fromTo(galleryHeading, { y: 55, autoAlpha: 0, filter: "blur(7px)" }, { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: .5, ease: "power3.out" }, "<.8");
      story.addLabel("gallery-ready");
      story.to({}, { duration: 0.55 }); // Brief gallery reveal, then zoom immediately.
      story.to(galleryHeading, { autoAlpha: 0, y: -30, duration: .24 });
      story.to(galleryHint, { autoAlpha: 0, duration: .24 }, "<");
      [0].forEach((i) => {
        const card = cards[i];
        const overlay = overlays[i];
        const start = `zoom-${i}`;
        story.addLabel(start);
        // A single DOM image grows from its own actual size to the viewport.
        // No fullscreen duplicate, clip-path swap, or overlapping image layer.
        const originalWidth = () => mobile() ? vw() * .55 : vw() * .42;
        const originalHeight = () => mobile() ? vh() * .27 : vh() * .38;
        story.to(cards.filter((_, j) => j !== i), {
          autoAlpha: 0, duration: 0.3
        }, start);
        story.to(galleryBottomFade, { autoAlpha: 0, duration: 0.3 }, start);
        story.to(card, {
          x: 0, y: 0, z: 0, rotationY: 0, rotationZ: 0,
          width: () => vw(), height: () => vh(),
          zIndex: 46, duration: 1.8, ease: "power2.inOut",
        }, start);
        story.fromTo(overlay, { autoAlpha: 0, y: 25 }, {
          autoAlpha: 1, y: 0, duration: .48, ease: "power2.out",
          immediateRender: false,
        }, `${start}+=1.35`);
        story.to(nav, { autoAlpha: 1, duration: .25, onStart: () => { nav.style.pointerEvents = "auto"; }, onReverseComplete: () => { nav.style.pointerEvents = "none"; } }, `${start}+=1.75`);
        story.to({}, { duration: .75 });
        const retreat = `retreat-${i}`;
        story.addLabel(retreat);
        story.to(nav, { autoAlpha: 0, duration: .25, onStart: () => { nav.style.pointerEvents = "none"; }, onReverseComplete: () => { nav.style.pointerEvents = "auto"; } }, retreat);
        story.to(overlay, { autoAlpha: 0, y: -12, duration: .35 }, retreat);
        story.to(card, {
          width: originalWidth, height: originalHeight,
          ...arc(i), duration: 1.6, ease: "power2.inOut",
        }, `${retreat}+=.2`);
        story.to(cards.filter((_, j) => j !== i), {
          autoAlpha: 1, duration: .55,
        }, `${retreat}+=1.2`);
        story.to(galleryBottomFade, { autoAlpha: 1, duration: .55 }, `${retreat}+=1.2`);
        story.to({}, { duration: 0.16 });
      });
      story.addLabel("gallery-finished");
      story.to(track, { x: () => -vw() * 3, duration: 1.4 });
      const closing = rootEl.querySelectorAll("[data-closing-reveal]");
      story.fromTo(closing, { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .65, stagger: .1, ease: "power2.out" }, "<.5");
      // Navigation only works when the image is fully expanded. It swaps the
      // image/content without touching the card's transform or ScrollTrigger.
      navigation.current = (direction) => {
        if (switchingRef.current) return;
        const t = story.time();
        const opened = story.labels["zoom-0"] + 1.95;
        const closing = story.labels["retreat-0"];
        if (t < opened || t >= closing) return;
        switchingRef.current = true;
        const next = (selectedRef.current + direction + projects.length) % projects.length;
        const content = overlays[0].querySelectorAll<HTMLElement>("p, h3");
        gsap.timeline({ onComplete: () => { switchingRef.current = false; } })
          .to([mainImage, ...Array.from(content)], { opacity: 0, x: -direction * 22, duration: .22, ease: "power2.in" })
          .call(() => {
            selectedRef.current = next;
            setSelected(next);
          })
          .set([mainImage, ...Array.from(content)], { x: direction * 22 })
          .to([mainImage, ...Array.from(content)], { opacity: 1, x: 0, duration: .38, ease: "power2.out" });
      };
      requestAnimationFrame(() => ScrollTrigger.refresh());
      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, rootEl);
    return () => { navigation.current = null; ctx.revert(); };
  }, [loading]);

  return <main ref={root} data-custom-cursor data-cursor-ready="false" className={`${sans.variable} ${serif.variable} w-full overflow-x-clip bg-[#faf8e8] text-[#205b37] font-[family-name:var(--font-dm-sans)]`}>
    <div ref={cursorRing} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[300] h-10 w-10 rounded-full border-[1.5px] border-[#39754b] bg-[#e1a735]/10 opacity-0" />
    <div ref={cursorDot} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[301] h-2.5 w-2.5 rounded-full bg-[#e1a735] opacity-0" />
    {loading && <div ref={loaderRef} role="status" aria-label="Loading Mango Trails" className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#f7f6e5] text-[#235e3b] transition-opacity duration-700">
      <div className="absolute -left-20 -bottom-28 h-80 w-80 rounded-full bg-[#dcebb6]/60 blur-3xl" />
      <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#f4e2a0]/50 blur-3xl" />
      <p data-loader-content className="mb-8 text-[10px] font-extrabold uppercase tracking-[.42em] text-[#8aa16c]">A JOURNEY THROUGH CAO LANH</p>
      <div data-loader-content className="overflow-hidden"><h2 className="animate-[pulse_1.6s_ease-in-out_infinite] font-[family-name:var(--font-editorial)] text-[clamp(56px,10vw,145px)] italic leading-none tracking-[-.06em]">Mango Trails<span className="text-[#e3a918]">.</span></h2></div>
      <div data-loader-content className="mt-10 h-[2px] w-52 overflow-hidden rounded-full bg-[#dce6c8]"><div className="h-full w-full origin-left animate-[pulse_1.2s_ease-in-out_infinite] bg-[#438650]" /></div>
      <p data-loader-content className="mt-5 text-[10px] uppercase tracking-[.25em] text-[#7a9970]">PREPARING YOUR JOURNEY</p>
    </div>}
    <section data-stage className="relative h-[100svh] min-h-[580px] overflow-hidden bg-[#faf8e8]">
      <header className="absolute inset-x-0 top-0 z-[100] flex h-[72px] items-center justify-between !bg-transparent px-[5vw]">
        <a href="#top" className={`flex items-center gap-3 text-xs font-extrabold tracking-[.12em] transition-colors duration-300 ${galleryFullscreen ? "text-white" : "text-[#205b37]"}`}><img src="/76cb5fbe-2b41-4e96-a4ee-00344fc4e9f2.jpg" alt="Mango Trails" className="h-11 w-11 rounded-xl object-cover" /><span>MANGO TRAILS<br />CAO LANH</span></a>
        <nav aria-label="Quick links" className="flex items-center gap-2 sm:gap-3">
          <a href="/map" className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-[11px] font-extrabold uppercase tracking-wider transition-colors sm:px-5 ${galleryFullscreen ? "border-white/60 text-white hover:bg-white/15" : "border-[#235e3b]/35 text-[#205b37] hover:bg-[#205b37]/10"}`}>
            Explore Map
          </a>
          <a href="/login" className="inline-flex h-10 items-center justify-center rounded-full bg-[#205b37] px-5 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#17462a] sm:px-6">
            Login
          </a>
        </nav>
      </header>
      <div className="absolute inset-x-0 top-[71px] z-[80] h-[2px] bg-transparent"><div data-progress className="h-full w-full origin-left scale-x-0 bg-[#2d8b52]" /></div>
      <div data-track className="flex h-full w-max will-change-transform">
        {/* PANEL 1 — editorial invitation to the mango country */}
        <section id="top" className="relative h-full w-screen shrink-0 overflow-hidden bg-[#f9f7ec] text-[#204d34]">
          <div className="pointer-events-none absolute -left-[24vw] -top-[35vh] h-[85vh] w-[85vw] rounded-full bg-[#e7eec9]/65 blur-[100px]" />
          <div className="pointer-events-none absolute -right-[18vw] bottom-[-44vh] h-[90vh] w-[80vw] rounded-full bg-[#f9e5ad]/35 blur-[100px]" />
          <div className="pointer-events-none absolute left-[5.5vw] top-[19vh] hidden h-px w-[18vw] bg-[#c4d4af] lg:block" />
          <div className="relative grid h-full grid-cols-1 items-center px-[6vw] pb-[5vh] pt-[104px] md:grid-cols-[57%_43%] md:pb-0 md:pt-[72px]">
            <div data-hero-copy className="relative z-20 flex flex-col items-start justify-center md:pr-[1vw]">
              <div data-hero-reveal className="mb-6 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[.23em] text-[#658052] md:mb-8"><span className="h-2 w-2 rounded-full bg-[#d5a137]" /> ĐỒNG THÁP, VIỆT NAM <span className="h-px w-8 bg-[#b6c59d]" /> MIỀN ĐẤT XỨ XOÀI</div>
              <h1 className="font-[family-name:var(--font-editorial)] text-[clamp(49px,6.5vw,112px)] leading-[1.02] tracking-[-.063em] text-[#204e35]">
                <span data-hero-reveal className="block">Về Cao Lãnh,</span>
                <span data-hero-reveal className="block italic text-[#cf9b2d]">nghe xoài</span>
                <span data-hero-reveal className="block">kể chuyện<span className="text-[#d4a33e]">.</span></span>
              </h1>
              <div data-hero-reveal className="mt-7 flex max-w-[510px] items-start gap-4 md:mt-9">
                <div className="mt-2 h-[72px] w-[3px] shrink-0 rounded-full bg-[#d8a646]" />
                <p className="text-[clamp(13px,1.1vw,16px)] leading-[1.9] text-[#657361]">Từ những vườn xoài trĩu quả đến câu chuyện của người làm vườn, Cao Lãnh mời bạn khám phá một miền quê bình dị, đậm đà hương vị Đồng Tháp.</p>
              </div>
              <div data-hero-reveal className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#638453] md:mt-7">
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d9a23b]" /> Vườn xoài xanh mát</span>
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d9a23b]" /> Văn hóa bản địa</span>
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d9a23b]" /> Hương vị miền Tây</span>
              </div>
              <div data-hero-reveal className="mt-7 flex items-center gap-4 md:mt-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#a3b58f] text-[#315d40]"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="6" /><path d="M12 6v5" /></svg></div>
                <div><p className="text-[10px] font-extrabold uppercase tracking-[.23em] text-[#315d40]">Cuộn để khám phá</p><p className="mt-1 text-[11px] text-[#84937b]">Hành trình bắt đầu từ đây</p></div>
              </div>
            </div>
            <div data-hero-art className="relative mx-auto flex h-[33vh] w-full max-w-[620px] items-center justify-center md:h-[78vh]">
              <div data-hero-orbit className="pointer-events-none absolute inset-[2%] rounded-[49%_51%_57%_43%/43%_40%_60%_57%] border border-dashed border-[#96ae7e]/55" />
              <div className="pointer-events-none absolute inset-[8%] rotate-[-15deg] rounded-[42%_58%_60%_40%/55%_36%_64%_45%] bg-[#dce9bb]" />
              <div className="pointer-events-none absolute inset-[13%] rotate-[13deg] rounded-[56%_44%_43%_57%/42%_59%_41%_58%] bg-[#f3dda1]/60" />
              <div data-hero-float className="relative z-10 flex h-[90%] w-[90%] items-center justify-center overflow-hidden rounded-[46%_54%_59%_41%/41%_48%_52%_59%] shadow-[0_32px_80px_rgba(46,89,49,.19)]">
                <img src={HERO_ART_IMAGE} alt="Minh họa hành trình khám phá xoài Cao Lãnh, Đồng Tháp" className="h-full w-full object-cover object-center" />
              </div>
              <div data-hero-stamp className="pointer-events-none absolute -bottom-[1%] -left-[2%] z-20 hidden rotate-[-8deg] rounded-2xl border border-[#e2dec7] bg-[#fffdf5]/95 px-5 py-4 shadow-[0_14px_40px_rgba(39,75,40,.1)] md:block">
                <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-[#87957b]">THE MANGO LAND</p>
                <p className="mt-1 font-[family-name:var(--font-editorial)] text-[23px] italic text-[#2e6842]">Cao Lãnh, Đồng Tháp</p>
              </div>
              <div data-hero-stamp className="pointer-events-none absolute -right-[1%] top-[13%] z-20 hidden h-16 w-16 items-center justify-center rounded-full bg-[#d6a344] text-center text-[9px] font-extrabold uppercase leading-4 tracking-[.08em] text-white shadow-lg md:flex">VỊ XOÀI<br />DẪN LỐI</div>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-[3vh] right-[5vw] hidden items-center gap-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#93a084] md:flex"><span className="h-px w-12 bg-[#b7c3aa]" />01 — THE BEGINNING</div>
        </section>
        {/* PANEL 2 — destination story, not a technology pitch */}
        <section className="relative h-full w-screen shrink-0 overflow-hidden bg-[#eaf0db] text-[#205b37]">
          <div className="pointer-events-none absolute -right-[20vw] -top-[30vh] h-[75vh] w-[75vw] rounded-full bg-[#f8edc8]/65 blur-[90px]" />
          <div className="relative grid h-full grid-cols-1 items-center gap-5 px-[7vw] pb-[6vh] pt-[100px] md:grid-cols-[56%_44%] md:gap-10">
            <div className="relative z-10 max-w-[780px]" data-panel2-reveal>
              <p className="mb-6 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[.25em] text-[#64844e]"><span className="h-px w-8 bg-[#a4b791]" /> 02 / CHUYỆN KỂ XỨ XOÀI</p>
              <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(48px,6.2vw,108px)] leading-[1.02] tracking-[-.065em]">Không chỉ là<br /><span className="italic text-[#ce9a2b]">một trái xoài.</span></h2>
              <p className="mt-6 max-w-[500px] font-[family-name:var(--font-editorial)] text-[clamp(19px,2vw,31px)] italic text-[#62894f]">Đó là hương vị của một vùng đất.</p>
              <p className="mt-5 max-w-[490px] text-[clamp(13px,1.05vw,16px)] leading-[1.9] text-[#536a53]">Ghé thăm vườn xoài, lắng nghe người nông dân kể chuyện mùa vụ, thử trải nghiệm bao trái và thưởng thức hương vị xoài qua những món ăn dân dã. Mỗi hoạt động là một cách đến gần hơn với Cao Lãnh.</p>
              <div className="mt-6 grid max-w-[590px] grid-cols-3 gap-2 md:mt-8 md:gap-3">
                {[
                  { no: "01", title: "Dạo vườn xoài", detail: "Hít hà hương cây trái" },
                  { no: "02", title: "Cùng nhà vườn", detail: "Tìm hiểu cách chăm xoài" },
                  { no: "03", title: "Nếm vị Cao Lãnh", detail: "Khám phá món ngon từ xoài" },
                ].map(item => <div key={item.no} className="rounded-[16px] border border-[#b4c9a5]/65 bg-[#fffdf4]/60 px-3 py-3 backdrop-blur-sm md:rounded-[20px] md:px-4 md:py-4">
                  <span className="text-[10px] font-extrabold tracking-wider text-[#cb9731]">{item.no} /</span>
                  <h3 className="mt-2 text-[11px] font-extrabold text-[#285c3b] md:text-[13px]">{item.title}</h3>
                  <p className="mt-1 hidden text-[10px] leading-5 text-[#71836c] lg:block">{item.detail}</p>
                </div>)}
              </div>
            </div>
            <div data-panel2-reveal className="relative mx-auto h-[30vh] w-[85%] md:h-[64vh] md:w-full">
              <div className="absolute inset-[2%] rotate-[7deg] rounded-[48%_52%_39%_61%/49%_38%_62%_51%] bg-[#d7e5b4]" />
              <img src="https://images.openai.com/static-rsc-4/IsiWt_feP8pMOnZawzrU0fzrL0nKFovFyM-eB7Pjr7VEE783W0IFQjDWKJWSo6uSkkXH9Gz34Ty_LrsVo5z_ge3DA_Rh2XvxRz-OOBwRMqtcGbIlSR-USokglLgADHhNcTjxfZbxAPpkzr2kDVv-clhb7H28hJaCSWysDOrJTezNvu0UDLyzuuJv5locNZhM?purpose=fullsize" alt="Khung cảnh xanh mát miền quê" className="absolute inset-0 h-full w-full rotate-[-4deg] rounded-[43%_57%_52%_48%/44%_45%_55%_56%] object-cover shadow-[0_24px_65px_rgba(36,83,48,.18)]" />
              <div className="absolute -bottom-4 right-0 rounded-2xl bg-[#fffbed] px-5 py-4 shadow-xl"><p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#9b9b70]">MỘT CHUYẾN ĐI · NHIỀU KÝ ỨC</p><p className="mt-1 font-[family-name:var(--font-editorial)] text-xl italic text-[#2b6841]">Chạm vào Cao Lãnh</p></div>
            </div>
          </div>
        </section>
        <section data-gallery className="relative h-full w-screen shrink-0 overflow-hidden bg-[#faf8e8] text-[#205b37]">
          <div data-gallery-backdrop className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,#fcfbea_0%,#f0f4d8_70%,#e5edc5_100%)]" />
          <div data-gallery-heading className="pointer-events-none absolute inset-x-4 top-[11vh] z-20 text-center">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[.32em] text-[#658a50]">03 / NHỮNG LÁT CẮT CAO LÃNH</p>
            <h2 className="font-[family-name:var(--font-editorial)] text-[clamp(35px,5vw,76px)] leading-[.95] text-[#225e3b]">Một miền đất <i className="text-[#d9a11a]">đáng nhớ.</i></h2>
            <p className="mt-4 text-xs tracking-widest text-[#678354]">MỖI KHUNG HÌNH · MỘT CÂU CHUYỆN</p>
          </div>
          <div data-gallery-scene className="absolute inset-0 z-30 [perspective:1450px] [transform-style:preserve-3d]">
            {projects.map((_, i) => {
              const project = projects[(selected + i) % projects.length]; return <div key={i} data-arc-card className={`absolute left-1/2 top-1/2 overflow-hidden bg-[#253535] shadow-[0_18px_45px_rgba(79,39,0,.22)] will-change-transform [backface-visibility:hidden] ${i === 0
                ? "h-[27svh] w-[55vw] md:h-[38svh] md:w-[42vw]"
                : "h-[22svh] w-[37vw] md:h-[29svh] md:w-[26vw]"
                }`}>
                <img src={project.image} alt={project.title} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 text-[10px] font-bold tracking-widest text-white">0{(selected + i) % projects.length + 1}</span>
              </div>;
            })}
          </div>
          <div data-gallery-bottom-fade className="pointer-events-none absolute inset-x-0 bottom-0 z-[34] h-[19vh] bg-gradient-to-t from-[#faf8e8] via-[#faf8e8]/65 to-transparent" />
          <div data-gallery-nav className="absolute bottom-[5vh] left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 opacity-0">
            <button type="button" aria-label="Previous gallery story" onClick={() => navigation.current?.(-1)} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-black/75 active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></button>
            <button type="button" aria-label="Next gallery story" onClick={() => navigation.current?.(1)} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-lg backdrop-blur-sm transition-all hover:scale-105 hover:bg-black/75 active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg></button>
          </div>
          {[projects[selected]].map((project) => <div key="active-story" data-story-overlay className="pointer-events-none absolute inset-0 z-[55] flex flex-col justify-end bg-gradient-to-r from-black/90 via-black/55 via-50% to-transparent px-[7vw] pb-[16vh] text-[#fffdf0] opacity-0">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[.25em] text-[#ffdc69]">{project.category} · 0{selected + 1} / 0{projects.length}</p>
            <h3 className="max-w-[760px] font-[family-name:var(--font-editorial)] text-[clamp(46px,6.8vw,104px)] leading-[1.02] tracking-[-.045em] text-[#fffef0] drop-shadow-[0_4px_20px_rgba(0,0,0,.4)]">{project.title}</h3>
            <p className="mt-6 max-w-[480px] border-l-2 border-[#ffd67b] pl-5 text-[clamp(14px,1.1vw,17px)] leading-[1.8] text-[#fffdf1]">{project.description}</p>
          </div>)}
          <p data-gallery-hint className="absolute inset-x-0 bottom-[13vh] z-20 text-center text-[10px] uppercase tracking-[.3em] text-[#678354]">Scroll to explore · Use arrows when fullscreen</p>
        </section>
        <section className="relative flex h-full w-screen shrink-0 items-center justify-center overflow-hidden bg-[#eaf0d1] px-6 text-center text-[#205b37]">
          <div className="pointer-events-none absolute -right-[15vw] -top-[35vh] h-[85vh] w-[85vw] rounded-full bg-[#f8f7e6] blur-[75px]" />
          <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pt-16 text-center sm:px-8">
            <p data-closing-reveal className="mb-2 text-[10px] font-extrabold uppercase tracking-[.3em] text-[#6c9454]">06 / 06 · {EVENT.name}</p>
            <h2 data-closing-reveal className="font-[family-name:var(--font-editorial)] text-[clamp(38px,5.2vw,72px)] leading-[.96] tracking-[-.06em]">Trạm Hẹn<br /><span className="italic text-[#dba11a]">Cao Lãnh.</span></h2>
            <p data-closing-reveal className="mx-auto mt-3 max-w-3xl text-[12px] leading-5 text-[#536b50] sm:text-sm">{EVENT.description}</p>
            <div className="mx-auto mt-4 grid max-w-4xl grid-cols-2 gap-2 text-left">
              {EVENT.highlights.map((highlight, index) => (
                <div key={highlight} data-closing-reveal className="flex items-start gap-2 rounded-2xl border border-[#b7c9a9]/70 bg-[#fffdf3]/65 px-3 py-2.5">
                  <span className="font-[family-name:var(--font-editorial)] text-lg italic text-[#c9932e]">0{index + 1}</span>
                  <span className="text-[10px] leading-4 text-[#536b50] sm:text-xs sm:leading-5">{highlight}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {EVENT.meta.map((item) => (
                <div key={item.label} data-closing-reveal className="rounded-full border border-[#9db48b]/50 bg-[#fffdf3]/70 px-4 py-2 text-left">
                  <span className="mr-2 text-[9px] font-bold uppercase tracking-wider text-[#829274]">{item.label}</span>
                  <span className="text-[10px] font-semibold text-[#315d40]">{item.value}</span>
                </div>
              ))}
            </div>
            <div data-closing-reveal className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <a href={EVENT.ticketHref} className="rounded-full bg-[#24643e] px-7 py-3 text-xs font-extrabold tracking-wider text-[#fffbed] shadow-md transition-transform hover:-translate-y-1">Tạo Vé Hẹn Chu Du ↗</a>
              <a href="/map" className="rounded-full border border-[#24643e]/35 px-5 py-3 text-xs font-extrabold tracking-wider text-[#24643e] transition-colors hover:bg-[#24643e]/10">Xem lại bản đồ</a>
            </div>
            <p data-closing-reveal className="mx-auto mt-2 max-w-2xl text-[10px] italic text-[#71836c]">{EVENT.ticketNote}</p>
          </div>
        </section>
      </div>
    </section>
  </main>;
}
