const BLOCKS = "[data-section-heading], [data-fade-up], [data-destination], [data-image-frame], .photo-library-heading>div, .photo-library-filters, [data-library-photo], .photo-library-more, footer>div>div";

export function setupLandingReveals(root: HTMLElement, motion: MediaQueryList) {
  const animations = new Map<HTMLElement, Animation>();
  const groups = new Map<Element, { targets: HTMLElement[]; delay: number; kind: "line" | "image" | "block" }>();
  const prepared = new Set<HTMLElement>();
  const show = (node: HTMLElement) => { node.dataset.revealed = "true"; };
  const reveal = (node: HTMLElement, delay: number, kind: "line" | "image" | "block") => {
    if (motion.matches) { show(node); return; }
    const from = kind === "line"
      ? { opacity: 0, transform: "translate3d(0, 105%, 0)", filter: "blur(3px)" }
      : kind === "image"
        ? { opacity: 0, transform: "translate3d(0, 28px, 0) scale(.97)", filter: "blur(0px)" }
        : { opacity: 0, transform: "translate3d(0, 22px, 0)", filter: "blur(2px)" };
    const animation = node.animate([from, { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)", filter: "blur(0px)" }], {
      duration: kind === "line" ? 1050 : kind === "image" ? 1100 : 800,
      delay, easing: "cubic-bezier(.16,1,.3,1)", fill: "both",
    });
    animations.set(node, animation);
    animation.onfinish = () => { show(node); animations.delete(node); animation.cancel(); };
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
    if (motion.matches) targets.forEach(show);
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
  const reduceMotion = () => {
    if (!motion.matches) return;
    observer.disconnect(); prepared.forEach(show);
    animations.forEach(animation => animation.cancel()); animations.clear();
  };
  const focus = (event: FocusEvent) => {
    if (!(event.target instanceof HTMLElement)) return;
    prepared.forEach(node => {
      if (node === event.target || node.contains(event.target as Node)) {
        show(node); animations.get(node)?.cancel(); animations.delete(node);
      }
    });
  };
  motion.addEventListener("change", reduceMotion);
  root.addEventListener("focusin", focus);
  return () => {
    observer.disconnect(); mutations.disconnect();
    animations.forEach(animation => animation.cancel()); prepared.forEach(show);
    motion.removeEventListener("change", reduceMotion); root.removeEventListener("focusin", focus);
  };
}
