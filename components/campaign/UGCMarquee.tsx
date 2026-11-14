"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

const labels = ["HÁT MỘC", "CÙNG BEAT", "ĐỆM ĐÀN", "SONG CA", "THEO GU BẠN"];

export default function UGCMarquee() {
  const track = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = track.current, first = group.current;
    if (!node || !first) return;
    let tween: gsap.core.Tween | undefined;
    const animate = () => {
      const progress = tween?.progress() ?? 0;
      tween?.kill();
      const width = first.getBoundingClientRect().width;
      if (!width) return;
      tween = gsap.fromTo(node, { x: 0 }, { x: -width, duration: width / 75, repeat: -1, ease: "none" }).progress(progress);
    };
    const observer = new ResizeObserver(animate);
    observer.observe(first);
    animate();
    return () => { observer.disconnect(); tween?.kill(); gsap.set(node, { clearProps: "transform" }); };
  }, []);
  return <div className="ugc-marquee" aria-label={labels.join(", ")} style={{ overflow: "hidden", width: "100%", whiteSpace: "nowrap" }}>
    <div ref={track} aria-hidden="true" style={{ display: "flex", flexWrap: "nowrap", width: "max-content", willChange: "transform" }}>
      {[0,1].map(copy=><div ref={copy===0?group:undefined} key={copy} style={{ display: "flex", flexShrink: 0, flexWrap: "nowrap", alignItems: "center", justifyContent: "space-around", minWidth: "100vw", gap: 38, paddingInline: 19 }}>
        {labels.map(label=><span key={label} style={{ display: "inline-flex", flexShrink: 0, alignItems: "center", gap: 38 }}>{label}<span style={{ color: "#e8a18a" }}>✦</span></span>)}
      </div>)}
    </div>
  </div>;
}
