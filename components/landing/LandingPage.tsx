"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EVENT } from "@/components/campaign/campaignData";

const HERO_ART_IMAGE = "/banner.jpg";
const INTRO_STORY = "Vị Xoài Dẫn Lối là dự án truyền thông của nhóm sinh viên FPT, giới thiệu du lịch trải nghiệm Cao Lãnh đến người trẻ TP.HCM. Từ xoài Cát, dự án kể về miệt vườn, người trồng và Trạm Hẹn Cao Lãnh.";

const projects = [
  { title: "Một sớm ở Tràm Chim", category: "ĐẤT NGẬP NƯỚC", location: "Tam Nông · Đồng Tháp", detail: "Mùa nước nổi", description: "Đi thuyền giữa đồng cỏ và những lối nước len qua rừng tràm. Sáng sớm là lúc dễ bắt gặp chim bay đi kiếm ăn.", image: "/tram-chim.jpg" },
  { title: "Tân Quy Đông mùa hoa", category: "LÀNG NGHỀ", location: "Sa Đéc · Đồng Tháp", detail: "Rộn ràng nhất vào dịp Tết", description: "Vườn hoa nối nhau dọc các con kênh. Ghé cận Tết, bạn sẽ thấy người trồng tất bật chăm hoa và chuẩn bị chuyển hàng đi các tỉnh.", image: "/sa-dec-flowers.jpg" },
  { title: "Qua cổng chùa Vĩnh Tràng", category: "KIẾN TRÚC", location: "Mỹ Tho · Tiền Giang", detail: "Một ngôi chùa thế kỷ 19", description: "Dạo qua cổng tam quan, sân cây cảnh rồi vào chánh điện. Mỗi dãy nhà có cách trang trí riêng, pha trộn nhiều ảnh hưởng kiến trúc.", image: "/vinh-trang.jpg" },
  { title: "Mái ngói Kiến An Cung", category: "DI SẢN", location: "Sa Đéc · Đồng Tháp", detail: "Xây dựng từ năm 1924", description: "Mái ngói ba lớp, tượng gốm và những mảng chạm nhiều màu làm nên vẻ riêng của ngôi chùa người Hoa giữa phố Sa Đéc.", image: "/kien-an-cung.jpg" },
  { title: "Chuyện trong vườn xoài", category: "VƯỜN NHÀ", location: "Cao Lãnh · Đồng Tháp", detail: "Theo mùa thu hoạch", description: "Đi một vòng dưới tán cây, xem nhà vườn bao trái và nghe chuyện chăm xoài. Đến mùa, có thể thử hái quả ngay tại vườn.", image: "/cao-lanh-orchard.jpg" },
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
    let didFinish = false;
    const started = Date.now();
    const hero = new Image();
    const finish = () => {
      if (didFinish) return;
      didFinish = true;
      void document.fonts.ready.then(() => {
        const remaining = Math.max(0, 450 - (Date.now() - started));
        window.setTimeout(() => {
          if (!active) return;
          const overlay = loaderRef.current;
          if (!overlay) { setLoading(false); return; }
          const introText = overlay.querySelector<HTMLElement>("[data-intro-text]");
          const storyCharacters = Array.from(INTRO_STORY);
          const typeState = { count: 0 };
          const progress = overlay.querySelector<HTMLElement>("[data-intro-progress]");
          if (introText) introText.textContent = "";
          if (progress) gsap.set(progress, { scaleX: 0 });
          const typing = gsap.timeline({
            onComplete: () => {
              if (!active) return;
              const minHold = Math.max(0, 1350 - (Date.now() - started));
              window.setTimeout(() => {
                if (!active) return;
                gsap.timeline({ onComplete: () => { if (active) setLoading(false); } })
                  .to(overlay.querySelectorAll("[data-loader-content]"), { y: -24, autoAlpha: 0, duration: .45, stagger: .055, ease: "power3.inOut" })
                  .to(overlay, { yPercent: -105, duration: .85, ease: "power4.inOut" }, "-=.12");
              }, minHold);
            },
          });
          typing.to(typeState, {
            count: storyCharacters.length,
            duration: storyCharacters.length * .045,
            ease: "none",
            onUpdate: () => {
              if (introText) introText.textContent = storyCharacters.slice(0, Math.floor(typeState.count)).join("");
            },
          });
          if (progress) typing.to(progress, { scaleX: 1, duration: storyCharacters.length * .045, ease: "none" }, 0);
        }, remaining);
      });
    };
    hero.onload = () => { void hero.decode().then(finish, finish); };
    hero.onerror = finish;
    hero.src = HERO_ART_IMAGE;
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const dot = cursorDot.current;
    const ring = cursorRing.current;
    if (!dot || !ring || !window.matchMedia("(any-pointer: fine)").matches) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    const setDotX = gsap.quickSetter(dot, "x", "px");
    const setDotY = gsap.quickSetter(dot, "y", "px");
    const setRingX = gsap.quickSetter(ring, "x", "px");
    const setRingY = gsap.quickSetter(ring, "y", "px");
    type PullTo = { x: (value: number) => void; y: (value: number) => void };
    const textPulls = new WeakMap<HTMLElement, PullTo>();
    let activeMagnet: HTMLElement | null = null;
    let activeTextPulls: Array<{ node: HTMLElement; pull: PullTo }> = [];
    let positioned = false;
    const move = (e: PointerEvent) => {
      if (!positioned) {
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        positioned = true;
      }
      const target = e.target instanceof Element ? e.target : null;
      const magnet = target?.closest<HTMLElement>("[data-cursor-magnet]") ?? null;
      const interactive = !!target?.closest("a, button, [data-cursor-interactive]");
      let cursorX = e.clientX;
      let cursorY = e.clientY;
      let proximity = 0;
      if (magnet) {
        const rect = magnet.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = centerX - e.clientX;
        const dy = centerY - e.clientY;
        const distance = Math.hypot(dx, dy);
        const triggerDistance = Math.max(rect.width, rect.height) * 0.6;
        if (distance < triggerDistance) {
          proximity = 1 - distance / triggerDistance;
          const pull = 0.68 + proximity * 0.22;
          cursorX += dx * pull;
          cursorY += dy * pull;
        }
        if (magnet !== activeMagnet) {
          activeTextPulls.forEach(({ pull }) => { pull.x(0); pull.y(0); });
          activeMagnet = magnet;
          const nodes = Array.from(magnet.querySelectorAll<HTMLElement>("[data-cursor-text]"));
          if (nodes.length === 0 && magnet.matches("a, button, [data-cursor-interactive]")) nodes.push(magnet);
          activeTextPulls = nodes.map((node) => {
            let pull = textPulls.get(node);
            if (!pull) {
              pull = {
                x: gsap.quickTo(node, "x", { duration: reduceMotion ? 0 : 0.3, ease: "power3.out" }),
                y: gsap.quickTo(node, "y", { duration: reduceMotion ? 0 : 0.3, ease: "power3.out" }),
              };
              textPulls.set(node, pull);
            }
            return { node, pull };
          });
        }
        activeTextPulls.forEach(({ node, pull }) => {
          const strength = (node === magnet ? 0.24 : 0.34) * proximity;
          const maxX = node === magnet ? 24 : 54;
          const maxY = node === magnet ? 18 : 34;
          pull.x(Math.max(-maxX, Math.min(maxX, (e.clientX - centerX) * strength)));
          pull.y(Math.max(-maxY, Math.min(maxY, (e.clientY - centerY) * strength)));
        });
      } else if (activeMagnet) {
        activeTextPulls.forEach(({ pull }) => { pull.x(0); pull.y(0); });
        activeMagnet = null;
        activeTextPulls = [];
      }
      setDotX(cursorX); setDotY(cursorY);
      setRingX(cursorX); setRingY(cursorY);
      gsap.to([dot, ring], { autoAlpha: 1, duration: reduceMotion ? 0 : .2, overwrite: "auto" });
      gsap.to(ring, {
        scale: magnet ? 1.85 : interactive ? 1.75 : 1,
        borderColor: magnet || interactive ? "#e1a735" : "#39754b",
        duration: reduceMotion ? 0 : .25, overwrite: "auto",
      });
      gsap.to(dot, { scale: magnet ? 1.45 : interactive ? .5 : 1, duration: reduceMotion ? 0 : .25, overwrite: "auto" });
    };
    const leave = () => {
      activeTextPulls.forEach(({ pull }) => { pull.x(0); pull.y(0); });
      activeMagnet = null;
      activeTextPulls = [];
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
    const stage = rootEl.querySelector<HTMLElement>("[data-stage]");
    const panelWidth = () => stage?.clientWidth ?? document.documentElement.clientWidth;
    rootEl.style.setProperty("--landing-panel-width", `${panelWidth()}px`);
    if (loading) return;
    const ctx = gsap.context(() => {
      // Keep the hero art in its resting position after the loader reveals it.
      gsap.set("[data-hero-float]", { y: 0, rotation: 0 });
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.set("[data-hero-orbit]", { rotation: 0, scale: 1 });
      if (!reduce) gsap.to("[data-hero-float]", { y: -13, rotation: 1.5, duration: 4.5, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 2.4 });
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
      const vw = panelWidth;
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
      gsap.set(cards, { autoAlpha: 0 });
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
      story.to("[data-hero-copy]", { x: -42, autoAlpha: 0, filter: "blur(4px)", duration: .46, ease: "power2.in" }, "<.42");
      story.to("[data-hero-art]", { x: 34, scale: .96, autoAlpha: .45, duration: .58, ease: "power2.in" }, "<");
      story.fromTo("[data-story-beat]", { autoAlpha: 0, filter: "blur(6px)", clipPath: "inset(0 0 18% 0)" }, { autoAlpha: 1, filter: "blur(0px)", clipPath: "inset(0 0 0% 0)", duration: .62, stagger: .12, ease: "power2.out" }, "<.42");
      story.fromTo("[data-story-visual]", { x: 70, rotation: 4, scale: .94, clipPath: "inset(0 0 0 16% round 36px)" }, { x: 0, rotation: 0, scale: 1, clipPath: "inset(0 0 0 0% round 36px)", duration: .9, ease: "power3.out" }, "<.05");
      story.fromTo("[data-story-caption]", { x: -22, y: 15, autoAlpha: 0 }, { x: 0, y: 0, autoAlpha: 1, duration: .5, ease: "power2.out" }, "<.58");
      story.to(track, { x: () => -vw() * 2, duration: 1.4 });
      story.fromTo(cards,
        { autoAlpha: 0, scale: .78, filter: "blur(9px)" },
        { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: .72, stagger: .08, ease: "back.out(1.25)", immediateRender: false },
        "<.3",
      );
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
      story.to(cards, { autoAlpha: 0, scale: .92, filter: "blur(5px)", duration: .42, stagger: .025 }, ">-.34");
      const closing = rootEl.querySelectorAll("[data-closing-reveal]");
      story.fromTo(closing, { y: 34, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .65, stagger: .1, ease: "power2.out" }, ">");
      const closingVisual = rootEl.querySelector<HTMLElement>("[data-closing-visual]");
      if (closingVisual) story.fromTo(closingVisual,
        { autoAlpha: 0, x: 70, rotation: 4, scale: .94, clipPath: "inset(0 0 0 18% round 32px)" },
        { autoAlpha: 1, x: 0, rotation: 0, scale: 1, clipPath: "inset(0 0 0 0% round 32px)", duration: .82, ease: "power3.out" },
        ">",
      );
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
      const onResize = () => {
        rootEl.style.setProperty("--landing-panel-width", `${panelWidth()}px`);
        ScrollTrigger.refresh();
      };
      window.addEventListener("resize", onResize);
      const titleLines = Array.from(rootEl.querySelectorAll<HTMLElement>("[data-hero-title-line]"));
      const heroImage = rootEl.querySelector<HTMLElement>("[data-hero-image]");
      const heroArt = rootEl.querySelector<HTMLElement>("[data-hero-art]");
      const removeHoverListeners: Array<() => void> = [];
      if (window.matchMedia("(any-hover: hover) and (any-pointer: fine)").matches) {
        titleLines.forEach((line) => {
          const baseColor = window.getComputedStyle(line).color;
          const enter = () => gsap.to(line, {
            x: 14, scale: 1.025, color: "#c9932e", filter: "drop-shadow(0 8px 18px rgba(201,147,46,.28))",
            duration: reduce ? 0 : 0.4, ease: "back.out(1.7)", overwrite: "auto",
          });
          const leave = () => gsap.to(line, {
            x: 0, scale: 1, color: baseColor, filter: "drop-shadow(0 0 0 transparent)",
            duration: reduce ? 0 : 0.5, ease: "elastic.out(1, 0.55)", overwrite: "auto",
          });
          line.addEventListener("pointerenter", enter);
          line.addEventListener("pointerleave", leave);
          removeHoverListeners.push(() => {
            line.removeEventListener("pointerenter", enter);
            line.removeEventListener("pointerleave", leave);
          });
        });
        if (heroImage && heroArt) {
          const moveArt = (event: PointerEvent) => {
            const bounds = heroArt.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            gsap.to(heroImage, {
              transformPerspective: 900, scale: 1.12, rotationY: x * 9, rotationX: y * -9,
              filter: "saturate(1.22) contrast(1.05)",
              duration: reduce ? 0 : 0.5, ease: "power3.out", overwrite: "auto",
            });
          };
          const leaveArt = () => gsap.to(heroImage, {
            scale: 1, rotationY: 0, rotationX: 0,
            filter: "saturate(1) contrast(1)",
            duration: reduce ? 0 : 0.65, ease: "power3.out", overwrite: "auto",
          });
          heroArt.addEventListener("pointermove", moveArt);
          heroArt.addEventListener("pointerleave", leaveArt);
          removeHoverListeners.push(() => {
            heroArt.removeEventListener("pointermove", moveArt);
            heroArt.removeEventListener("pointerleave", leaveArt);
          });
        }
        const featureCards = Array.from(rootEl.querySelectorAll<HTMLElement>("[data-feature-card]"));
        featureCards.forEach((card) => {
          const enter = () => gsap.to(card, {
            x: 6, borderColor: "#c6932e", backgroundColor: "rgba(255,253,244,.52)",
            duration: reduce ? 0 : 0.32, ease: "power3.out", overwrite: "auto",
          });
          const leave = () => gsap.to(card, {
            x: 0, borderColor: "rgba(180,201,165,.65)", backgroundColor: "transparent",
            duration: reduce ? 0 : 0.42, ease: "power3.out", overwrite: "auto",
          });
          card.addEventListener("pointerenter", enter);
          card.addEventListener("pointerleave", leave);
          removeHoverListeners.push(() => {
            card.removeEventListener("pointerenter", enter);
            card.removeEventListener("pointerleave", leave);
          });
        });
        const galleryCards = Array.from(rootEl.querySelectorAll<HTMLElement>("[data-arc-card]"));
        galleryCards.forEach((card) => {
          const image = card.querySelector<HTMLElement>("img");
          if (!image) return;
          const enter = () => gsap.to(image, {
            scale: 1.07, filter: "saturate(1.18) contrast(1.04)",
            duration: reduce ? 0 : 0.45, ease: "power3.out", overwrite: "auto",
          });
          const leave = () => gsap.to(image, {
            scale: 1, filter: "saturate(1) contrast(1)",
            duration: reduce ? 0 : 0.55, ease: "power3.out", overwrite: "auto",
          });
          card.addEventListener("pointerenter", enter);
          card.addEventListener("pointerleave", leave);
          removeHoverListeners.push(() => {
            card.removeEventListener("pointerenter", enter);
            card.removeEventListener("pointerleave", leave);
          });
        });
        const actionLinks = Array.from(rootEl.querySelectorAll<HTMLElement>("a[data-cursor-magnet]"));
        actionLinks.forEach((link) => {
          const enter = () => gsap.to(link, {
            scale: 1.05, boxShadow: "0 14px 32px rgba(35,70,40,.2)",
            duration: reduce ? 0 : 0.28, ease: "back.out(1.7)", overwrite: "auto",
          });
          const leave = () => gsap.to(link, {
            scale: 1, boxShadow: "0 0 0 rgba(35,70,40,0)",
            duration: reduce ? 0 : 0.38, ease: "power3.out", overwrite: "auto",
          });
          link.addEventListener("pointerenter", enter);
          link.addEventListener("pointerleave", leave);
          removeHoverListeners.push(() => {
            link.removeEventListener("pointerenter", enter);
            link.removeEventListener("pointerleave", leave);
          });
        });
      }
      return () => {
        window.removeEventListener("resize", onResize);
        removeHoverListeners.forEach((remove) => remove());
      };
    }, rootEl);
    return () => { navigation.current = null; ctx.revert(); };
  }, [loading]);

  return <main ref={root} data-custom-cursor className="landing-fonts w-full overflow-x-clip bg-[#faf8e8] text-[#205b37] font-[family-name:var(--font-dm-sans)]">
    <div ref={cursorRing} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[300] h-10 w-10 rounded-full border-[1.5px] border-[#39754b] bg-[#e1a735]/10 opacity-0" />
    <div ref={cursorDot} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[301] h-2.5 w-2.5 rounded-full bg-[#e1a735] opacity-0" />
    {loading && <div ref={loaderRef} role="status" aria-label="Loading Mango Trails" className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#f7f6e5] text-[#235e3b] transition-opacity duration-700">
      <div className="absolute -left-20 -bottom-28 h-80 w-80 rounded-full bg-[#dcebb6]/60 blur-3xl" />
      <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#f4e2a0]/50 blur-3xl" />
      <p data-loader-content className="mb-7 font-mono text-[9px] tracking-[.24em] text-[#8a956f] sm:mb-9 sm:text-[10px]">DỰ ÁN TRUYỀN THÔNG FPT / CAO LÃNH</p>
      <p data-loader-content data-intro-copy aria-label={INTRO_STORY} className="mx-auto max-w-[900px] px-6 text-center font-[family-name:var(--font-editorial)] text-[clamp(20px,2.7vw,36px)] leading-[1.55] tracking-[-.025em] text-[#28573a]">
        <span data-intro-text aria-hidden="true" />
        <span aria-hidden="true" className="ml-1 inline-block h-[1.05em] w-px translate-y-[.15em] animate-pulse bg-[#d3a33d]" />
      </p>
      <div data-loader-content className="mt-9 h-px w-36 overflow-hidden bg-[#dce6c8] sm:mt-11 sm:w-48"><div data-intro-progress className="h-full w-full origin-left scale-x-0 bg-[#438650]" /></div>
      <p data-loader-content className="mt-4 font-mono text-[9px] tracking-[.18em] text-[#7a9970]">MANGO TRAILS · VỊ XOÀI DẪN LỐI</p>
    </div>}
    <section data-stage className="relative h-[100svh] min-h-[580px] overflow-hidden bg-[#faf8e8]">
      <header className="absolute inset-x-0 top-0 z-[100] flex h-[72px] items-center justify-between !bg-transparent px-[5vw]">
        <a href="#top" className={`flex items-center gap-3 text-xs font-extrabold tracking-[.12em] transition-colors duration-300 ${galleryFullscreen ? "text-white" : "text-[#205b37]"}`}><img src="/76cb5fbe-2b41-4e96-a4ee-00344fc4e9f2.jpg" alt="Mango Trails" className="h-11 w-11 rounded-xl object-cover" /><span>MANGO TRAILS<br />CAO LANH</span></a>
        <nav aria-label="Quick links" className="flex items-center gap-2 sm:gap-3">
          <a data-cursor-magnet href="/map" className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-[11px] font-extrabold uppercase tracking-wider transition-colors sm:px-5 ${galleryFullscreen ? "border-white/60 text-white hover:bg-white/15" : "border-[#235e3b]/35 text-[#205b37] hover:bg-[#205b37]/10"}`}>
            Explore Map
          </a>
          <a data-cursor-magnet href="/api/auth/google?next=%2Fdashboard" className="inline-flex h-10 items-center justify-center rounded-full bg-[#205b37] px-5 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#17462a] sm:px-6">
            Login
          </a>
        </nav>
      </header>
      <div className="absolute inset-x-0 top-[71px] z-[80] h-[2px] bg-transparent"><div data-progress className="h-full w-full origin-left scale-x-0 bg-[#2d8b52]" /></div>
      <div data-track className="flex h-full w-max will-change-transform">
        {/* PANEL 1 — editorial invitation to the mango country */}
        <section id="top" className="relative h-full w-[var(--landing-panel-width,100vw)] shrink-0 overflow-hidden bg-[#f9f7ec] text-[#204d34]">
          <div className="pointer-events-none absolute left-[5.5vw] top-[19vh] hidden h-px w-[18vw] bg-[#c4d4af] lg:block" />
          <div className="relative grid h-full grid-cols-1 items-center px-[6vw] pb-[5vh] pt-[104px] md:grid-cols-[57%_43%] md:pb-0 md:pt-[72px]">
            <div data-hero-copy className="relative z-20 flex flex-col items-start justify-center md:pr-[1vw]">
              <div className="mb-6 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[.23em] text-[#658052] md:mb-8"><span className="h-2 w-2 rounded-full bg-[#d5a137]" /> MỘT DỰ ÁN TRUYỀN THÔNG <span className="h-px w-8 bg-[#b6c59d]" /> CAO LÃNH · ĐỒNG THÁP</div>
              <h1 className="font-[family-name:var(--font-editorial)] text-[clamp(49px,6.5vw,112px)] leading-[1.02] tracking-[-.063em] text-[#204e35]">
                <span data-hero-title-line data-cursor-magnet className="block"><span data-cursor-text className="inline-block">Theo vị xoài Cát,</span></span>
                <span data-hero-title-line data-cursor-magnet className="block italic text-[#cf9b2d]"><span data-cursor-text className="inline-block">mở lối</span></span>
                <span data-hero-title-line data-cursor-magnet className="block"><span data-cursor-text className="inline-block">chu du<span className="text-[#d4a33e]">.</span></span></span>
              </h1>
              <div className="mt-7 flex max-w-[510px] items-start gap-4 md:mt-9">
                <div className="mt-2 h-[72px] w-[3px] shrink-0 rounded-full bg-[#d8a646]" />
                <p className="text-[clamp(13px,1.1vw,16px)] leading-[1.9] text-[#657361]">Nhóm kể chuyện Cao Lãnh qua một lát cắt gần gũi: mùa xoài, người chăm vườn và những món ăn làm nên hương vị quê nhà.</p>
              </div>
              <div className="mt-5 grid w-full max-w-[620px] grid-cols-3 gap-2 border-t border-[#c4d4af] pt-3 md:mt-7 md:gap-4 md:pt-4">
                {[
                  { no: "01", title: "ĐI · Vào vườn", detail: "Theo lối nhỏ dưới tán xoài." },
                  { no: "02", title: "GẶP · Người trồng", detail: "Nghe chuyện chăm từng trái." },
                  { no: "03", title: "NẾM · Vị quê", detail: "Thử xoài và món địa phương." },
                ].map((item) => <div data-feature-card key={item.no} className="border-r border-[#c4d4af] px-2 py-2 transition-colors last:border-r-0 md:px-3">
                  <span className="font-mono text-[9px] tracking-[.12em] text-[#c6932e]">{item.no} /</span>
                  <h3 className="mt-1 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#315d40] sm:text-[11px]">{item.title}</h3>
                  <p className="mt-1 hidden text-[10px] leading-4 text-[#71836c] sm:block">{item.detail}</p>
                </div>)}
              </div>
              <div className="mt-3 hidden w-full max-w-[620px] items-center justify-between border-y border-[#b7c89d] py-3 text-[#315d40] sm:flex md:mt-4">
                <div><p className="font-mono text-[8px] tracking-[.2em] text-[#a87a24] md:text-[9px]">MANGO TRAILS · CAO LÃNH</p><p className="mt-1 text-[10px] text-[#657361] md:text-xs">Một câu chuyện địa phương, kể bằng hình ảnh và trải nghiệm</p></div>
                <span aria-hidden="true" className="ml-3 text-xl text-[#e8c66e]">↗</span>
              </div>
              <div className="mt-4 flex items-center gap-4 md:mt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#a3b58f] text-[#315d40]"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="6" /><path d="M12 6v5" /></svg></div>
                <div><p className="text-[10px] font-extrabold uppercase tracking-[.23em] text-[#315d40]">Cuộn để khám phá</p><p className="mt-1 text-[11px] text-[#84937b]">Hành trình bắt đầu từ đây</p></div>
              </div>
            </div>
            <div data-hero-art className="relative mx-auto flex h-[25svh] w-full max-w-[620px] items-center justify-center md:h-[78vh]">
              <div data-hero-orbit className="pointer-events-none absolute inset-[2%] border border-[#96ae7e]/55" />
              <div data-hero-float data-cursor-magnet className="relative z-10 flex h-[90%] w-[90%] items-center justify-center overflow-hidden border border-[#d5c690] bg-[#e4eacb] shadow-[12px_12px_0_0_rgba(214,222,184,.8)]">
                <img data-hero-image src={HERO_ART_IMAGE} alt="Minh họa hành trình khám phá xoài Cao Lãnh, Đồng Tháp" className="h-full w-full object-cover object-center [transform-style:preserve-3d]" />
              </div>
              <div data-hero-stamp className="pointer-events-none absolute -bottom-[1%] -left-[2%] z-20 hidden border border-[#d5c690] bg-[#fffbed] px-4 py-3 md:block">
                <p className="font-mono text-[9px] tracking-[.14em] text-[#87957b]">FIELD NOTES / 01</p>
                <p className="mt-1 font-[family-name:var(--font-editorial)] text-[21px] italic text-[#2e6842]">Cao Lãnh, Đồng Tháp</p>
              </div>
              <div data-hero-stamp className="pointer-events-none absolute -right-[1%] top-[13%] z-20 hidden border border-[#d6a344] bg-[#fffbed] px-3 py-2 font-mono text-[9px] leading-4 tracking-[.08em] text-[#315d40] md:block">VỊ XOÀI<br />DẪN LỐI</div>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-[3vh] right-[5vw] hidden items-center gap-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#93a084] md:flex"><span className="h-px w-12 bg-[#b7c3aa]" />01 — THE BEGINNING</div>
        </section>
        {/* PANEL 2 — destination story, not a technology pitch */}
        <section className="relative h-full w-[var(--landing-panel-width,100vw)] shrink-0 overflow-hidden bg-[#eaf0db] text-[#205b37]">
          <div className="pointer-events-none absolute right-0 top-[14vh] h-px w-[23vw] bg-[#d0d8b6]" />
          <div className="relative grid h-full grid-cols-1 items-center gap-5 px-[7vw] pb-[6vh] pt-[100px] md:grid-cols-[56%_44%] md:gap-10">
            <div className="relative z-10 max-w-[780px]">
              <p data-story-beat className="mb-6 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[.25em] text-[#64844e]"><span className="h-px w-8 bg-[#a4b791]" /> 02 / SỢI CHỈ ĐỎ CỦA DỰ ÁN</p>
              <h2 data-story-beat data-cursor-magnet className="font-[family-name:var(--font-editorial)] text-[clamp(48px,6.2vw,108px)] leading-[1.02] tracking-[-.065em]"><span data-cursor-text className="inline-block">Một trái xoài,</span><br /><span data-cursor-text className="inline-block italic text-[#ce9a2b]">nhiều câu chuyện.</span></h2>
              <p data-story-beat data-cursor-magnet className="mt-6 max-w-[500px] font-[family-name:var(--font-editorial)] text-[clamp(19px,2vw,31px)] italic text-[#62894f]"><span data-cursor-text className="inline-block">Từ tán cây đến bàn ăn.</span></p>
              <p data-story-beat className="mt-5 max-w-[520px] text-[clamp(13px,1.05vw,16px)] leading-[1.9] text-[#536a53]">Xoài Cát là điểm khởi đầu để nhóm lần theo nhịp sống Cao Lãnh: trái được chăm trong vườn, người làm vườn giữ mùa, rồi hương vị ấy đi vào những món quen.</p>
              <div className="mt-6 grid max-w-[590px] grid-cols-3 gap-2 md:mt-8 md:gap-3">
                {[
                  { no: "01", title: "VƯỜN", detail: "Nơi câu chuyện bắt đầu." },
                  { no: "02", title: "NGƯỜI", detail: "Những bàn tay giữ mùa." },
                  { no: "03", title: "VỊ", detail: "Xoài đi từ vườn ra bàn ăn." },
                ].map(item => <div data-story-beat data-feature-card key={item.no} className="border-t border-[#92a77d] px-2 py-3 md:px-3 md:py-4">
                  <span className="font-mono text-[9px] tracking-wider text-[#cb9731]">{item.no} /</span>
                  <h3 className="mt-2 text-[11px] font-extrabold tracking-[.12em] text-[#285c3b] md:text-[13px]">{item.title}</h3>
                  <p className="mt-2 hidden text-[9px] leading-4 text-[#71836c] sm:block md:text-[10px] md:leading-5">{item.detail}</p>
                </div>)}
              </div>
              <p data-story-beat className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.16em] text-[#71836c] md:mt-5 md:text-[10px]"><span className="h-1.5 w-1.5 rounded-full bg-[#d5a137]" /> MANGO TRAILS — THEO VỊ XOÀI CÁT, MỞ LỐI CHU DU</p>
            </div>
            <div data-story-visual className="relative mx-auto h-[30vh] w-[85%] md:h-[64vh] md:w-full">
              <div className="absolute inset-[2%] translate-x-3 translate-y-3 border border-[#aebc91]" />
              <img src="/cao-lanh-orchard.jpg" alt="Khách tham quan dưới tán xoài ở Cao Lãnh" className="absolute inset-0 h-full w-full border border-[#d5c690] object-cover" />
              <div data-story-caption className="absolute bottom-[16%] left-[-3%] z-20 flex items-center gap-3 border border-[#d5c690] bg-[#fffbed] p-2.5">
                <img src="/text-theme.jpg" alt="" className="h-14 w-20 rounded-xl object-cover object-[85%_center]" />
                <div><p className="text-[8px] font-extrabold uppercase tracking-[.18em] text-[#9b9b70]">TỪ VƯỜN ĐẾN BÀN ĂN</p><p className="mt-1 font-[family-name:var(--font-editorial)] text-sm italic text-[#2b6841]">Vị xoài Cao Lãnh</p></div>
              </div>
              <div className="absolute -bottom-4 right-0 border border-[#d5c690] bg-[#fffbed] px-4 py-3"><p className="font-mono text-[9px] tracking-[.15em] text-[#9b9b70]">FRAME 01 / VƯỜN CAO LÃNH</p><p className="mt-1 font-[family-name:var(--font-editorial)] text-lg italic text-[#2b6841]">Trái lớn lên trong vườn</p></div>
            </div>
          </div>
        </section>
        <section data-gallery className="relative h-full w-[var(--landing-panel-width,100vw)] shrink-0 overflow-hidden bg-[#faf8e8] text-[#205b37]">
          <div data-gallery-backdrop className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,#fcfbea_0%,#f0f4d8_70%,#e5edc5_100%)]" />
          <div data-gallery-heading className="pointer-events-none absolute inset-x-4 top-[11vh] z-20 text-center">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[.32em] text-[#658a50]">03 / NHỮNG ĐIỂM DỪNG MIỀN TÂY</p>
            <h2 data-cursor-magnet className="pointer-events-auto font-[family-name:var(--font-editorial)] text-[clamp(35px,5vw,76px)] leading-[.95] text-[#225e3b]"><span data-cursor-text className="inline-block">Mỗi nơi một <i className="text-[#d9a11a]">nhịp sống.</i></span></h2>
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
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.25em] text-[#ffdc69]">{project.category} · 0{selected + 1} / 0{projects.length}</p>
            <h3 className="max-w-[760px] font-[family-name:var(--font-editorial)] text-[clamp(46px,6.8vw,104px)] leading-[1.02] tracking-[-.045em] text-[#fffef0] drop-shadow-[0_4px_20px_rgba(0,0,0,.4)]">{project.title}</h3>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[9px] font-bold uppercase tracking-[.16em] text-white/70"><span>{project.location}</span><span>{project.detail}</span></div>
            <p className="mt-4 max-w-[520px] border-l-2 border-[#ffd67b] pl-5 text-[clamp(14px,1.1vw,17px)] leading-[1.8] text-[#fffdf1]">{project.description}</p>
          </div>)}
          <p data-gallery-hint className="absolute inset-x-0 bottom-[13vh] z-20 text-center text-[10px] uppercase tracking-[.3em] text-[#678354]">Cuộn để xem từng điểm · Dùng mũi tên khi ảnh mở lớn</p>
        </section>
        <section className="relative h-full w-[var(--landing-panel-width,100vw)] shrink-0 overflow-hidden bg-[#eaf0d1] px-6 text-[#205b37]">
          <div className="pointer-events-none absolute -right-[15vw] -top-[35vh] h-[85vh] w-[85vw] rounded-full bg-[#f8f7e6] blur-[75px]" />
          <div className="relative z-10 mx-auto grid h-full w-full max-w-6xl items-center gap-7 px-3 pb-6 pt-16 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:py-12">
            <div className="text-center lg:text-left">
              <p data-closing-reveal className="mb-2 text-[10px] font-extrabold uppercase tracking-[.3em] text-[#6c9454]">06 / 06 · {EVENT.name}</p>
              <h2 data-closing-reveal data-cursor-magnet className="font-[family-name:var(--font-editorial)] text-[clamp(38px,5.2vw,72px)] leading-[.96] tracking-[-.06em]"><span data-cursor-text className="inline-block">Trạm Hẹn</span><br /><span data-cursor-text className="inline-block italic text-[#dba11a]">Cao Lãnh.</span></h2>
              <p data-closing-reveal className="mx-auto mt-3 max-w-3xl text-[12px] leading-5 text-[#536b50] sm:text-sm lg:mx-0">{EVENT.description}</p>
              <div className="mx-auto mt-4 grid max-w-4xl grid-cols-2 gap-2 text-left lg:mx-0">
                {EVENT.highlights.map((highlight, index) => (
                  <div key={highlight} data-closing-reveal className="flex items-start gap-2 rounded-2xl border border-[#b7c9a9]/70 bg-[#fffdf3]/65 px-3 py-2.5">
                    <span className="font-[family-name:var(--font-editorial)] text-lg italic text-[#c9932e]">0{index + 1}</span>
                    <span className="text-[10px] leading-4 text-[#536b50] sm:text-xs sm:leading-5">{highlight}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
                {EVENT.meta.map((item) => (
                  <div key={item.label} data-closing-reveal className="rounded-full border border-[#9db48b]/50 bg-[#fffdf3]/70 px-4 py-2 text-left">
                    <span className="mr-2 text-[9px] font-bold uppercase tracking-wider text-[#829274]">{item.label}</span>
                    <span className="text-[10px] font-semibold text-[#315d40]">{item.value}</span>
                  </div>
                ))}
              </div>
              <div data-closing-reveal className="mt-4 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <a data-cursor-magnet href={EVENT.ticketHref} className="rounded-full bg-[#24643e] px-7 py-3 text-xs font-extrabold tracking-wider text-[#fffbed] shadow-md transition-shadow hover:shadow-lg">Tạo Vé Hẹn Chu Du ↗</a>
                <a data-cursor-magnet href="/map" className="rounded-full border border-[#24643e]/35 px-5 py-3 text-xs font-extrabold tracking-wider text-[#24643e] transition-colors hover:bg-[#24643e]/10">Xem lại bản đồ</a>
              </div>
              <p data-closing-reveal className="mx-auto mt-2 max-w-2xl text-[10px] italic text-[#71836c] lg:mx-0">{EVENT.ticketNote}</p>
            </div>
            <figure data-closing-visual className="relative hidden h-[58vh] min-h-[390px] overflow-hidden rounded-[2rem] border border-white/50 opacity-0 shadow-[0_35px_90px_rgba(35,70,40,.2)] lg:block">
              <img src="/banner.jpg" alt="Minh họa vườn xoài và dòng sông miền Tây" className="h-full w-full object-cover object-[78%_center]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#163b26]/75 via-transparent to-transparent" />
              <figcaption className="absolute inset-x-6 bottom-6 text-left text-[#fffdf0]">
                <span className="text-[9px] font-bold uppercase tracking-[.25em] text-[#f5d776]">CAO LÃNH · ĐỒNG THÁP</span>
                <p className="mt-2 font-[family-name:var(--font-editorial)] text-3xl italic">Một chuyến đi, nhiều điều để nhớ.</p>
              </figcaption>
            </figure>
          </div>
        </section>
      </div>
    </section>
  </main>;
}
