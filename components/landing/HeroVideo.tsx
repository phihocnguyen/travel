"use client";

import { useEffect, useRef } from "react";

const VIDEO_SOURCE = "/FDown.vn_Tai_video_Facebook_720p%20(HD)_0dd2.mp4";

export default function HeroVideo({ poster }: { poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    let inView = true;

    const update = () => {
      if (!inView || document.hidden) {
        video.pause();
        return;
      }
      // The source and muted autoplay are present in HTML, before hydration.
      video.muted = true;
      if (video.paused) void video.play().catch(() => { /* Keep the static fallback if autoplay is blocked. */ });
    };
    const observer = new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting);
      update();
    }, { threshold: 0 });

    observer.observe(video);
    update();
    document.addEventListener("visibilitychange", update);
    window.addEventListener("pageshow", update);
    video.addEventListener("canplay", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("pageshow", update);
      video.removeEventListener("canplay", update);
      video.pause();
    };
  }, []);

  return (
    <video
      ref={ref}
      data-hero-video
      src={VIDEO_SOURCE}
      poster={poster}
      preload="metadata"
      autoPlay
      muted
      loop
      playsInline
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover object-center"
    />
  );
}
