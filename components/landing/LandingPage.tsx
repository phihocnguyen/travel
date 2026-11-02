"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const projects = [
  { title: "The Journey", category: "MANGO · CAO LÃNH", image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=1500&q=85", color: "#d9a53e" },
  { title: "Orchard Life", category: "LOCAL STORIES", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1500&q=85", color: "#a9b8bd" },
  { title: "Local Flavours", category: "FOOD · CULTURE", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1500&q=85", color: "#c2a58e" },
  { title: "Trạm Hẹn Cao Lãnh", category: "AN INTERACTIVE EVENT", image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1500&q=85", color: "#d3c4c0" },
  { title: "Your Journey Pass", category: "MAKE IT YOURS", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1500&q=85", color: "#aab4a1" },
];

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const section = root.current!.querySelector<HTMLElement>("[data-gallery]")!;
      const track = section.querySelector<HTMLElement>("[data-track]")!;
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
      const names = gsap.utils.toArray<HTMLElement>("[data-name]");
      const count = section.querySelector<HTMLElement>("[data-count]")!;
      const total = cards.length;

      // One pinned ScrollTrigger drives the image rail, active project and counter.
      gsap.to(track, {
        y: () => -(track.scrollHeight - section.clientHeight),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * (total - 1)}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const active = Math.min(total - 1, Math.round(self.progress * (total - 1)));
            count.textContent = String(active + 1).padStart(2, "0");
            names.forEach((name, index) => name.classList.toggle("is-active", index === active));
          },
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <main ref={root} className="portfolio-page">
      <section className="gallery" data-gallery>
        <header className="topbar">
          <a className="brand" href="#top">VỊ XOÀI<br />DẪN LỐI</a>
          <nav><a href="#works">JOURNEY</a><a href="#about">ABOUT</a><a href="#event">THE EVENT</a><a href="#start">GET YOUR PASS</a></nav>
        </header>
        <div className="gallery-grid" id="works">
          <div className="side-note note-left">A journey inspired by mangoes<br />Cao Lãnh · Đồng Tháp</div>
          <div className="image-window">
            <div className="image-track" data-track>
              {projects.map((project, i) => <figure className="project-card" data-card key={project.title} style={{ backgroundColor: project.color }}>
                <img src={project.image} alt={project.title} />
                <figcaption><span>{project.category}</span><span>{String(i + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span></figcaption>
              </figure>)}
            </div>
          </div>
          <div className="project-list">{projects.map((project, i) => <div className={`project-name ${i === 0 ? "is-active" : ""}`} data-name key={project.title}>{project.title}</div>)}</div>
          <div className="side-note note-right">One journey pass<br />Many things to discover</div>
          <div className="counter"><span data-count>01</span><small>/{String(projects.length).padStart(2, "0")}</small></div>
          <div className="scroll-cue"><span /> SCROLL TO EXPLORE</div>
        </div>
      </section>
      <section className="intro-card" id="about">
        <p className="eyebrow">A JOURNEY THROUGH CAO LÃNH</p>
        <h1>VỊ XOÀI<br />DẪN LỐI</h1>
        <h2>Follow the taste of Cat Chu mangoes, and let them lead the way.</h2>
        <p className="body-copy"><strong>VỊ XOÀI DẪN LỐI</strong> is a travel campaign promoting immersive experiences in the mango-growing region of Cao Lãnh, Đồng Tháp. It is created for young people aged 18–24 in Ho Chi Minh City.</p>
        <p className="body-copy">Starting with Cat Chu mangoes, the campaign invites you to discover more than local flavours—from orchard landscapes and growers’ daily lives to hands-on activities and the cultural stories of Cao Lãnh.</p>
      </section>
      <section className="event-card" id="event">
        <div><p className="eyebrow">TRẠM HẸN CAO LÃNH</p><h2>One journey pass.<br />A world to discover.</h2>
          <p className="body-copy">Trạm Hẹn Cao Lãnh is an immersive event within the VỊ XOÀI DẪN LỐI campaign. Inspired by a countryside fair and an adventure game, it takes you on a journey through Cao Lãnh with interactive stations and fun challenges.</p></div>
        <div className="discover"><h3>HERE, YOU CAN</h3><ul><li>Explore travel and accommodation options for your trip.</li><li>Discover experiences at local mango orchards.</li><li>Explore local cuisine and regional specialties.</li><li>Take on games, collect Garden Points, and win exciting prizes.</li></ul></div>
      </section>
      <section className="start-card" id="start"><p className="eyebrow">READY TO SET OFF?</p><h2>Create your own Journey Pass and get ready to explore Cao Lãnh with us.</h2><div className="event-meta"><span><small>DATE</small>November 21, 2026 · Tentative</span><span><small>LOCATION</small>Ho Chi Minh City</span></div><p className="tagline">Your Journey Pass—the first ticket to a world of discovery.</p><a href="/dashboard/tickets/new">CREATE YOUR JOURNEY PASS ↗</a></section>
      <style jsx global>{`
        * { box-sizing: border-box; }
        html { background: #777; scroll-behavior: auto; scrollbar-width: none; }
        html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
        body { margin: 0; background: #777; font-family: Arial, Helvetica, sans-serif; scrollbar-width: none; }
        .portfolio-page { width: 100vw; min-height: 100vh; padding: 0; color: #111; overflow: clip; }
        .gallery { width: 100vw; height: 100vh; height: 100svh; min-height: 0; overflow: hidden; position: relative; background: #fff; border-radius: 0; }
        .topbar { height: 58px; position: absolute; inset: 0 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 2.2vw; border-bottom: 1px solid #ededed; z-index: 10; background: rgba(255,255,255,.94); }
        .brand { color: #111; text-decoration: none; font-weight: 900; letter-spacing: -.07em; font-size: 15px; line-height: .84; }
        .topbar nav { display: flex; gap: clamp(13px, 2vw, 30px); }
        .topbar nav a { font-family: Impact, "Arial Narrow", sans-serif; font-stretch: condensed; text-decoration: none; color: #111; font-size: 13px; }
        .gallery-grid { position: absolute; inset: 58px 0 0; display: grid; grid-template-columns: 1fr 34% 1fr; align-items: stretch; }
        .image-window { grid-column: 2; grid-row: 1; height: 100%; overflow: hidden; }
        .image-track { display: flex; flex-direction: column; gap: 18px; padding: 0 0 8vh; will-change: transform; }
        .project-card { height: min(34vh, 300px); min-height: 210px; flex: 0 0 min(34vh, 300px); margin: 0; overflow: hidden; position: relative; background: #ddd; }
        .project-card img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .8s; }
        .project-card figcaption { position: absolute; inset: auto 0 0; display: flex; justify-content: space-between; padding: 12px 14px; color: white; font-size: 9px; letter-spacing: .1em; background: linear-gradient(transparent,rgba(0,0,0,.42)); }
        .project-list { grid-column: 3; grid-row: 1; align-self: start; justify-self: end; padding: 0 2vw 0 12px; max-width: 100%; display: flex; flex-direction: column; align-items: flex-end; gap: 3px; text-align: right; }
        .project-name { color: #b7b7b7; text-transform: uppercase; font-family: Impact, "Arial Narrow", sans-serif; font-size: clamp(16px, 2vw, 27px); line-height: 1.02; transition: color .35s, transform .35s; }
        .project-name.is-active { color: #111; transform: translateX(-5px); }
        .side-note { position: absolute; z-index: 2; top: 50%; font-family: Georgia, serif; font-size: 11px; font-style: italic; line-height: 1.5; }
        .note-left { left: 23%; transform: translate(-100%,-50%); text-align: right; }
        .note-right { right: 29%; transform: translate(100%,-50%); }
        .counter { position: absolute; left: 1.7vw; bottom: 4vh; display: flex; align-items: flex-end; gap: 9px; }
        .counter span { font-family: Impact, "Arial Narrow", sans-serif; font-size: clamp(68px, 11vw, 140px); line-height: .72; letter-spacing: -.06em; }
        .counter small { font-family: Impact, "Arial Narrow", sans-serif; font-size: 22px; padding-bottom: 2px; }
        .scroll-cue { position: absolute; right: 2vw; bottom: 5vh; display: flex; align-items: center; gap: 10px; font-size: 8px; letter-spacing: .16em; }
        .scroll-cue span { width: 30px; height: 1px; background: #111; }
        .intro-card, .event-card, .start-card { min-height: 76vh; padding: clamp(56px, 10vw, 140px) max(8vw, calc((100vw - 1100px)/2)); background: #f8f5ec; }
        .intro-card h1 { margin: 24px 0; font-size: clamp(60px, 12vw, 160px); letter-spacing: -.09em; line-height: .78; }
        .intro-card h2, .event-card h2, .start-card h2 { max-width: 850px; font-family: Georgia, serif; font-size: clamp(28px, 5vw, 66px); font-weight: 400; letter-spacing: -.05em; line-height: 1.04; }
        .eyebrow { font-size: 10px; font-weight: 700; letter-spacing: .2em; }
        .body-copy { max-width: 700px; font-size: clamp(15px, 1.5vw, 19px); line-height: 1.8; color: #45443c; }
        .event-card { display: grid; grid-template-columns: 1.15fr .85fr; align-items: center; gap: 8vw; background: #e7edda; }
        .discover { border-top: 1px solid #888; padding-top: 18px; }
        .discover h3 { font-size: 10px; letter-spacing: .2em; }
        .discover ul { padding-left: 18px; line-height: 1.7; font-size: 15px; }
        .discover li { padding: 8px 0; }
        .start-card { min-height: 78vh; background: #e3ad3f; display: flex; flex-direction: column; justify-content: center; }
        .start-card h2 { max-width: 900px; }
        .event-meta { display: flex; gap: 60px; margin: 30px 0; }
        .event-meta span { display: grid; gap: 8px; }
        .event-meta small { font-size: 9px; letter-spacing: .2em; }
        .tagline { font-family: Georgia, serif; font-style: italic; }
        .start-card > a { align-self: flex-start; margin-top: 18px; padding: 16px 22px; background: #111; color: #fff; text-decoration: none; font-size: 10px; letter-spacing: .12em; }
        @media (max-width: 700px) {
          .portfolio-page { width: 100vw; }
          .gallery { width: 100vw; height: 100vh; height: 100svh; min-height: 500px; }
          .topbar { height: 54px; padding: 0 18px; }
          .brand { font-size: 17px; }
          .topbar nav { gap: 11px; }
          .topbar nav a { font-size: 10px; }
          .gallery-grid { inset: 54px 0 0; grid-template-columns: 8% 64% 28%; }
          .image-track { gap: 14px; }
          .project-card { height: 37vh; min-height: 200px; flex-basis: 37vh; }
          .project-list { padding: 8px 10px 0 4px; gap: 5px; }
          .project-name { font-size: clamp(13px, 4vw, 20px); }
          .side-note { display: none; }
          .counter { left: 14px; bottom: 26px; gap: 5px; }
          .counter span { font-size: 68px; }
          .counter small { font-size: 16px; }
          .scroll-cue { right: 12px; bottom: 32px; font-size: 7px; }
          .event-card { grid-template-columns: 1fr; gap: 26px; }
          .event-meta { gap: 24px; flex-wrap: wrap; }
        }
        @media (prefers-reduced-motion: reduce) { .project-card img, .project-name { transition: none; } }
      `}</style>
    </main>
  );
}
