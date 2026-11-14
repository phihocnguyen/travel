import gsap from "gsap";

const BLOCKS = "[data-section-heading], [data-fade-up], [data-destination], [data-image-frame], .photo-library-heading>div, .photo-library-filters, [data-library-photo], .photo-library-more, footer>div>div";

export function setupLandingReveals(root: HTMLElement, reducedMotion: boolean) {
  const animations = new Map<HTMLElement, gsap.core.Tween>();
  const groups = new Map<Element, { targets: HTMLElement[]; delay: number; kind: "line" | "image" | "block" }>();
  const prepared = new Set<HTMLElement>();
  const show = (node: HTMLElement) => { node.dataset.revealed = "true"; };
  const reveal = (node: HTMLElement, delay: number, kind: "line" | "image" | "block") => {
    if (reducedMotion) { show(node); return; }
    const animation = gsap.fromTo(node, {
      opacity: 0,
      y: kind === "line" ? 0 : kind === "image" ? 28 : 22,
      yPercent: kind === "line" ? 105 : 0,
      scale: kind === "image" ? 0.97 : 1,
      filter: kind === "line" ? "blur(3px)" : kind === "image" ? "blur(0px)" : "blur(2px)",
    }, {
      opacity: 1, y: 0, yPercent: 0, scale: 1, filter: "blur(0px)",
      duration: kind === "line" ? 1.05 : kind === "image" ? 1.1 : 0.8,
      delay: delay / 1000, ease: "expo.out",
      onComplete: () => {
        show(node);
        animations.delete(node);
        gsap.set(node, { clearProps: "opacity,transform,filter" });
      },
    });
    animations.set(node, animation);
  };
  const observer = new IntersectionObserver(entries => {
    let stagger = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const group = groups.get(entry.target);
      if (!group) continue;
      observer.unobserve(entry.target);
      group.targets.forEach((node, index) => reveal(node, group.delay + stagger + index * 110, group.kind));
      stagger = Math.min(180, stagger + 45);
    }
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });
  const register = (node: HTMLElement, targets: HTMLElement[], kind: "line" | "image" | "block", delay = 0) => {
    if (groups.has(node)) return;
    targets.forEach(target => { delete target.dataset.revealed; prepared.add(target); });
    groups.set(node, { targets, kind, delay });
    if (reducedMotion) targets.forEach(show);
    else observer.observe(node);
  };
  const hero: [string, number][] = [["[data-nav-item]", 0], ["[data-hero-kicker]", 100], ["[data-hero-title]", 220], ["[data-hero-script]", 420], ["[data-hero-support]", 550], ["[data-hero-bottom]", 650]];
  hero.forEach(([selector, delay]) => root.querySelectorAll<HTMLElement>(selector).forEach((node, index) => register(node, [node], node.matches("[data-hero-title], [data-hero-script]") ? "line" : "block", delay + index * 100)));
  const scan = () => root.querySelectorAll<HTMLElement>(BLOCKS).forEach(node => {
    const lines = Array.from(node.querySelectorAll<HTMLElement>("[data-split-line]"));
    register(node, lines.length ? lines : [node], lines.length ? "line" : node.matches("[data-image-frame], [data-destination], [data-library-photo]") ? "image" : "block");
  });
  scan();
  // Newly loaded and filtered gallery cards join the same reveal sequence.
  const mutations = new MutationObserver(scan);
  mutations.observe(root, { childList: true, subtree: true });
  const focus = (event: FocusEvent) => {
    if (!(event.target instanceof HTMLElement)) return;
    prepared.forEach(node => {
      if (node === event.target || node.contains(event.target as Node)) {
        show(node); animations.get(node)?.kill(); animations.delete(node);
        gsap.set(node, { clearProps: "opacity,transform,filter" });
      }
    });
  };
  root.addEventListener("focusin", focus);
  return () => {
    observer.disconnect(); mutations.disconnect();
    animations.forEach(animation => animation.kill());
    prepared.forEach(node => { show(node); gsap.set(node, { clearProps: "opacity,transform,filter" }); });
    root.removeEventListener("focusin", focus);
  };
}

export function setupLandingButtons(root: HTMLElement, reducedMotion: boolean, selector = "[data-magnetic]") {
  const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const buttons = new Set<HTMLElement>();
  let active: HTMLElement | null = null;
  const reset = () => {
    if (!active) return;
    gsap.to(active, {
      x: 0, y: 0, scale: 1, duration: reducedMotion ? 0 : 0.55,
      ease: "elastic.out(1, 0.4)", overwrite: true, clearProps: "transform",
    });
    active = null;
  };
  const move = (event: PointerEvent) => {
    if (reducedMotion || !hover.matches || event.pointerType === "touch") return;
    const button = event.target instanceof Element
      ? event.target.closest<HTMLElement>(selector) : null;
    if (button !== active) { reset(); active = button; }
    if (!button) return;
    buttons.add(button);
    // Layout coordinates stay stable while GSAP translates the button.
    const bounds = button.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2 - Number(gsap.getProperty(button, "x"));
    const centerY = bounds.top + bounds.height / 2 - Number(gsap.getProperty(button, "y"));
    gsap.to(button, {
      x: gsap.utils.clamp(-10, 10, (event.clientX - centerX) * 0.18),
      y: gsap.utils.clamp(-8, 8, (event.clientY - centerY) * 0.18),
      scale: 1.035, duration: 0.3, ease: "power3.out", overwrite: "auto",
    });
  };
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerleave", reset);
  window.addEventListener("blur", reset);
  hover.addEventListener("change", reset);
  return () => {
    root.removeEventListener("pointermove", move);
    root.removeEventListener("pointerleave", reset);
    window.removeEventListener("blur", reset);
    hover.removeEventListener("change", reset);
    buttons.forEach(button => {
      gsap.killTweensOf(button);
      gsap.set(button, { clearProps: "transform" });
    });
  };
}
