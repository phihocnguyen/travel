"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { setupLandingButtons } from "@/components/landing/landingMotion";

export default function UGCMotion() {
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(".ugc-page");
    if (!root) return;
    const cleanupButtons = setupLandingButtons(root, false, ".ugc-button, [data-site-header] nav a, [data-site-header] button");
    const context = gsap.context(() => {
      gsap.fromTo(".ugc-heroCopy > *", { opacity: 0, y: 25 }, { opacity: 1, y: 0, stagger: 0.1, duration: 1, ease: "power3.out", clearProps: "opacity,transform" });
      gsap.fromTo(".ugc-art", { opacity: 0, y: 35, rotate: -5 }, { opacity: 1, y: 0, rotate: 0, duration: 1.3, ease: "power3.out", clearProps: "opacity,transform" });
      gsap.to(".ugc-art > svg", { y: -12, duration: 2.7, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }, root);
    const targets = Array.from(root.querySelectorAll<HTMLElement>(".ugc-sectionHeading,.ugc-about,.ugc-timelineIntro,.ugc-timeline li,.ugc-steps li,.ugc-rulesGrid>div,.ugc-rules li,.ugc-prizeSection,.ugc-notesSection>h2,.ugc-notes>div,.ugc-faq details,.ugc-final h2,.ugc-final .ugc-actions"));
    const observer = new IntersectionObserver(entries => {
      let index = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        context.add(() => {
          gsap.fromTo(entry.target, { opacity: 0, y: 30 }, { opacity: 1, y: 0, delay: Math.min(index++ * 0.07, 0.28), duration: 0.85, ease: "power3.out", clearProps: "opacity,transform" });
        });
      }
    }, { rootMargin: "0px 0px -35px 0px", threshold: 0 });
    context.add(() => gsap.set(targets, { opacity: 0, y: 30 }));
    targets.forEach(target => observer.observe(target));
    return () => { observer.disconnect(); cleanupButtons(); context.revert(); };
  }, []);
  return null;
}
